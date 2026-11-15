// Reading by the frames of a language world (reviewer 08:15: a language read through std.grammar-style
// frames as a voice next to machine translation, measured on meaning). A language world declares frames
// (`<lang>.frame name= en= act= mode= priority=`) as ordered parts (`<lang>.part frame= at= is= ...`):
// a lead or a phrase (`<lang>.phrase name= item=...`), fixed words (`word=`), a verb of an act (`act=`:
// a word whose lemma's sense is a verb of that act), a determiner (`<lang>.det form=`), and roles that
// take words, a number (`<lang>.numeral form= value=`, or digits), a preposition (`<lang>.prep form= rel=`),
// a list (`<lang>.lex name= item=...`) or the rest. Words are analysed by the language's morphology
// (std.morph: `morphOf`, `analyse`, a lazy `dictionary` with a sense per lemma), so inflected and
// unaccented forms read. The result is language-free: the act, the frame of the reference language it
// stands for (`en=`), and each role's words with their lemma, sense and reference word.

import { analyse, fold, splitClitics } from './morph.mjs';
import { valueText } from './parser.mjs';
import { choose } from './rank.mjs';
import { memoPerWorld } from './memo.mjs';

const bare = (v) => valueText(v);

/** The sense of a lemma as { act?, en?, pos? }: a verb fact of an act (k.actions.verb) by id, else the id's own shape (`<prefix>.<word>.<pos>.<n>`). */
export function senseOf(world, id) {
  if (!id) return {};
  const f = world.get(id);
  if (f?.attrs.act) return { act: bare(f.attrs.act[0]), en: bare(f.attrs.text?.[0] ?? id.split('.').pop()), pos: 'verb' };
  const m = /^k\.actions\.verb\.([^.]+)\.(.+)$/.exec(id);
  if (m) return { act: m[1], en: m[2].replace(/_/g, ' '), pos: 'verb' };
  const w = /\.([^.]+)\.(noun|verb|adjective|adverb)\.\d+$/.exec(id);
  return w ? { en: w[1].replace(/_/g, ' '), pos: w[2] } : {};
}

/**
 * Read `text` by the frames of a language world. Options: `lang` ('w.lang.ro'), `morph` (morphOf of the
 * language), `dictionary` (its lemma dictionary, with senses), `senses(id) -> { act, en, pos }` (default
 * senseOf), `max` (frames kept, 5), `lexicons` ({ name: [words] }: a host's words for a lexicon the frames take, such
 * as the values of its worlds for `value`). Returns { best, frames: [{ frame, en, act, mode, roles: { role: { text,
 * words: [{ form, lemma, sense, en, pos, features }], en, items? } }, score }], tokens } (items: a list cut at commas
 * and at the language's "and") with best null when no frame
 * takes every word (skip phrases aside).
 */
export function readFrames(world, text, { lang = 'w.lang.ro', morph: m, dictionary: dict, senses, max = 5, lexicons = {}, needs, open = false } = {}) {
  const norm = (s) => (m ? fold(m, String(s).toLowerCase()) : String(s).toLowerCase());
  const verbIndex = memoPerWorld(world, 'frames-verb-index', () => { const ix = new Map(); for (const v of world.ofType('k.actions.verb')) { const t = bare(v.attrs.text?.[0] ?? '').toLowerCase(); (ix.get(t) || ix.set(t, []).get(t)).push(bare(v.attrs.act?.[0])); } return ix; }); // a word's acts by the k.actions verbs the world holds
  const byVerb = (id) => { const acts = id ? verbIndex.get(String(id).toLowerCase()) : null; return acts?.length ? { act: acts.includes(String(id).toLowerCase()) ? String(id).toLowerCase() : acts[0], acts, en: String(id), pos: 'verb' } : null; };
  const sense = senses ?? ((id) => { const s0 = senseOf(world, id); return s0.act || s0.en ? s0 : byVerb(id) ?? s0; });
  const raw = String(text).toLowerCase().replace(/[.!?;:"“”()]+/g, ' ').replace(/['’]/g, '').replace(/,/g, ' , ').split(/\s+/).filter(Boolean); // didn't = didnt, as the language world writes its items
  let toks = raw.flatMap((t) => (t === ',' ? [t] : m ? splitClitics(m, t) : [t]));
  const byName = memoPerWorld(world, `phrases-by-name|${lang}`, () => { const ix = new Map(); for (const x of world.ofType(`${lang}.phrase`)) { const k = bare(x.attrs.name?.[0]); (ix.get(k) || ix.set(k, []).get(k)).push(...(x.attrs.item || []).map(bare)); } return ix; }); // bounded: the phrases, once per contents
  const itemsMemo = new Map();
  const items = (type, name) => { // a named phrase's items, folded: through the index, never a scan of the phrases per step
    if (type === `${lang}.lex` && lexicons[name]) return [...lexicons[name].map((i) => norm(String(i)).split(/\s+/)), ...world.ofType(type).filter((x) => bare(x.attrs.name?.[0]) === name).flatMap((x) => (x.attrs.item || []).map((i) => norm(bare(i)).split(/\s+/)))]; // the host's words for a lexicon (the values of its worlds) with the language world's
    if (type !== `${lang}.phrase`) return world.ofType(type).filter((x) => bare(x.attrs.name?.[0]) === name).flatMap((x) => (x.attrs.item || []).map((i) => norm(bare(i)).split(/\s+/)));
    if (!itemsMemo.has(name)) itemsMemo.set(name, (byName.get(name) || []).map((i) => norm(i).split(/\s+/)));
    return itemsMemo.get(name);
  };
  // words to pass over wherever they stand (a phrase named skip)
  for (const s of items(`${lang}.phrase`, 'skip').sort((a, b) => b.length - a.length)) {
    for (let i = 0; i + s.length <= toks.length; i++) if (s.every((x, j) => norm(toks[i + j]) === x)) { toks.splice(i, s.length); i--; }
  }
  const cuts = new Set(); // a comma is not a word: it marks where a list may be cut
  toks = toks.filter((t, i) => { if (t !== ',') return true; cuts.add(toks.slice(0, i).filter((x) => x !== ',').length); return false; });
  const F = toks.map(norm);
  const ands = new Set(world.ofType(`${lang}.particle`).filter((x) => bare(x.attrs.kind?.[0]) === 'conjunction' && bare(x.attrs.meaning?.[0]) === 'and').map((x) => norm(bare(x.attrs.form[0]))));
  const formOf = (d) => [...(d.attrs.form || []), ...(d.attrs.text || [])].map((v) => norm(bare(v))); // a closed word by its form (or text)
  const dets = new Set(world.ofType(`${lang}.det`).flatMap(formOf));
  const nums = new Map(world.ofType(`${lang}.numeral`).flatMap((d) => formOf(d).map((f) => [f, Number(bare(d.attrs.value?.[0]))])));
  const preps = new Map(world.ofType(`${lang}.prep`).flatMap((d) => formOf(d).map((f) => [f, bare(d.attrs.rel?.[0] ?? '')])));
  const memo = new Map();
  const readings = (i) => { // the analyses of token i, with their senses
    if (!memo.has(i)) {
      const as = m ? analyse(m, toks[i], { dictionary: dict }) : [{ lemma: toks[i], features: {} }]; // no morphology: the word is its own lemma
      memo.set(i, as.map((a) => { const e = dict?.lookup(a.lemma); const s = sense(e?.sense ?? (m ? undefined : a.lemma)); return { form: toks[i], lemma: a.lemma, sense: e?.sense ?? (s.act || s.en ? a.lemma : null), en: s.en ?? null, act: s.act ?? null, ...(s.acts ? { acts: s.acts } : {}), pos: s.pos ?? null, features: a.features }; }));
    }
    return memo.get(i);
  };
  const seqAt = (i, seq) => seq.length && seq.every((x, j) => F[i + j] === x);
  const frames = world.ofType(`${lang}.frame`).filter((f) => !needs || needs(f.attrs.needs ? bare(f.attrs.needs[0]) : undefined)).map((f) => ({ name: bare(f.attrs.name[0]), en: bare(f.attrs.en?.[0] ?? ''), act: bare(f.attrs.act?.[0] ?? ''), mode: f.attrs.mode ? bare(f.attrs.mode[0]) : null, priority: Number(bare(f.attrs.priority?.[0] ?? 0)) })); // `needs(name)`: the frames whose needs class the host has
  const lexNames = memoPerWorld(world, `lex-names|${lang}`, () => new Set([...world.ofType(`${lang}.lex`), ...world.ofType(`${lang}.phrase`)].map((x) => bare(x.attrs.name?.[0])))); // lexicons the language world has; another is the host's (open: any 1-3 words)
  const isOpen = (name) => open && !lexNames.has(name) && !lexicons[name];
  const fixedOf = memoPerWorld(world, `fixed|${lang}`, () => { const ix = new Map(); for (const x of world.ofType(`${lang}.fixed`)) { const k = bare(x.attrs.frame?.[0]); (ix.get(k) || ix.set(k, []).get(k)).push({ role: bare(x.attrs.role?.[0]), value: bare(x.attrs.value?.[0]) }); } return ix; }); // values a frame sets itself (acts.list.done: status=done)
  const maps = memoPerWorld(world, `role-maps|${lang}`, () => world.ofType(`${lang}.role_map`).map((x) => ({ act: bare(x.attrs.act?.[0]), role: bare(x.attrs.role?.[0]), to: bare(x.attrs.act_role?.[0]), frame: x.attrs.frame ? bare(x.attrs.frame[0]) : null }))); // a frame's role as the act's role (make: thing -> kind)
  const partsOf = new Map();
  for (const p of world.ofType(`${lang}.part`)) { const k = bare(p.attrs.frame[0]); (partsOf.get(k) || partsOf.set(k, []).get(k)).push(p); }
  const out = [];
  for (const fr of frames) { // bounded: the frames, each matched once by a search over its parts
    const parts = (partsOf.get(fr.name) || []).sort((a, b) => Number(bare(a.attrs.at[0])) - Number(bare(b.attrs.at[0]))).map((p) => ({ is: bare(p.attrs.is[0]), optional: bare(p.attrs.optional?.[0]) === 'yes', a: p.attrs }));
    let steps = 0;
    const go = (pi, ti, roles) => { // bounded: steps
      if (++steps > 4000) return null;
      if (pi === parts.length) return ti === toks.length ? roles : null;
      const p = parts[pi], a = p.a;
      const alt = p.optional ? () => go(pi + 1, ti, roles) : () => null;
      const take = (n, extra) => go(pi + 1, ti + n, extra ? { ...roles, ...extra } : roles);
      const seqs = (list) => { for (const s of list.sort((x, y) => y.length - x.length)) if (seqAt(ti, s)) { const r = take(s.length); if (r) return r; } return null; };
      let r = null;
      if (p.is === 'lead' || p.is === 'phrase') r = seqs(items(`${lang}.phrase`, bare(a.phrase?.[0])));
      else if (p.is === 'word') r = seqs((a.word || []).map((w) => norm(bare(w)).split(/\s+/)));
      else if (p.is === 'det') r = ti < toks.length && dets.has(F[ti]) ? take(1) : null;
      else if (p.is === 'lexicon') { // a word of a lexicon, not a role: the language world's, the host's, or (open) any 1-3 words
        const name = bare(a.lexicon?.[0]);
        if (isOpen(name)) { for (let n = 1; n <= 3 && ti + n <= toks.length && !r; n++) r = take(n); }
        else r = seqs([...items(`${lang}.lex`, name), ...items(`${lang}.phrase`, name)]);
      }
      else if (p.is === 'verb') { const want = bare(a.act?.[0]); const hit = ti < toks.length ? readings(ti).find((x) => x.act === want || x.acts?.includes(want)) : null; r = hit ? take(1, { _verb: { ...hit, act: want } }) : null; } // a verb of several acts (make: make, change) is each of them
      else if (p.is === 'role') {
        const role = bare(a.role[0]), takes = bare(a.takes?.[0] ?? 'words'), most = Number(bare(a.max_words?.[0] ?? 99));
        if (takes === 'number') { if (ti < toks.length && (nums.has(F[ti]) || /^\d+$/.test(F[ti]))) r = take(1, { [role]: { text: toks[ti], value: nums.get(F[ti]) ?? Number(F[ti]) } }); }
        else if (takes === 'prep') { if (ti < toks.length && preps.has(F[ti])) r = take(1, { [role]: { text: toks[ti], rel: preps.get(F[ti]) } }); }
        else if (takes === 'lexicon' && isOpen(bare(a.lexicon[0]))) { for (let n = 1; n <= 3 && ti + n <= toks.length && !r; n++) r = take(n, { [role]: { text: toks.slice(ti, ti + n).join(' '), span: [ti, ti + n], open: bare(a.lexicon[0]) } }); }
        else if (takes === 'lexicon') { const lex = [...items(`${lang}.lex`, bare(a.lexicon[0])), ...items(`${lang}.phrase`, bare(a.lexicon[0]))]; for (const s of lex.sort((x, y) => y.length - x.length)) if (seqAt(ti, s)) { r = take(s.length, { [role]: { text: toks.slice(ti, ti + s.length).join(' '), item: s.join(' ') } }); if (r) break; } }
        else { // words or the rest: the shortest span that lets the remaining parts match
          const hi = takes === 'rest' ? toks.length - ti : Math.min(most, toks.length - ti);
          for (let n = takes === 'rest' ? hi : 1; n <= hi && !r; n++) r = take(n, { [role]: { text: toks.slice(ti, ti + n).join(' '), span: [ti, ti + n] } });
        }
      }
      return r ?? alt();
    };
    const roles = go(0, 0, {});
    if (!roles) continue;
    const openTaken = (rs) => Object.values(rs).filter((v) => v && v.open).length * 2; // a span an open lexicon took: any words, so a reading with less of it is the better one
    const verb = roles._verb; delete roles._verb;
    const wordsOf = (a, b) => { const ws = []; for (let i = a; i < b; i++) { if (dets.has(F[i]) || ands.has(F[i])) continue; const rs = readings(i), best = rs.find((x) => x.sense) ?? rs[0]; ws.push(best ?? { form: toks[i], lemma: null, sense: null, en: null, pos: null }); } return ws; };
    for (const v of Object.values(roles)) if (v.span) { // each word of a role with its reading: lemma, sense, reference word
      const [a, b] = v.span;
      v.words = wordsOf(a, b);
      v.en = v.words.map((x) => x.en ?? x.form).join(' ');
      const at = [a]; // a list: the role cut at a comma or an "and" (<lang>.particle kind=conjunction meaning=and)
      for (let i = a + 1; i < b; i++) if (cuts.has(i) || ands.has(F[i])) at.push(i);
      if (at.length > 1) v.items = at.map((x, k) => { const ws = wordsOf(x, k + 1 < at.length ? at[k + 1] : b); return { text: toks.slice(x, k + 1 < at.length ? at[k + 1] : b).filter((t) => !ands.has(norm(t))).join(' '), words: ws, en: ws.map((y) => y.en ?? y.form).join(' ') }; }).filter((x) => x.words.length);
      delete v.span;
    }
    const known = Object.values(roles).flatMap((v) => v.words || []).filter((x) => x.sense).length + Object.values(roles).filter((v) => v.item !== undefined || v.rel !== undefined || v.value !== undefined).length; // a word with a sense, or a role read from a closed list
    for (const fx of fixedOf.get(fr.name) || []) if (!roles[fx.role]) roles[fx.role] = { value: fx.value, fixed: true }; // a value the frame sets itself
    const args = {}; // the roles as the act's roles: the role maps of the act (frame-specific first), else the role's own name
    for (const [k, v] of Object.entries(roles)) { const mp = maps.find((x) => x.act === fr.act && x.role === k && x.frame === fr.name) ?? maps.find((x) => x.act === fr.act && x.role === k && !x.frame); args[mp?.to ?? k] = v.value ?? v.item ?? v.en ?? v.text; }
    out.push({ frame: fr.name, en: fr.en, act: fr.act, mode: fr.mode, roles, args, ...(verb ? { verb: { form: verb.form, lemma: verb.lemma, en: verb.en } } : {}), score: fr.priority + known + parts.filter((p) => !p.optional).length / 10 - openTaken(roles, steps) });
  }
  const ranked = choose(world, 'frame', out, { seed: null }).order; // one way to choose (std.decide kind frame)
  return { best: ranked[0] ?? null, frames: ranked.slice(0, max), tokens: toks };
}
