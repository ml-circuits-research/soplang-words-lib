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
 * senseOf), `max` (frames kept, 5). Returns { best, frames: [{ frame, en, act, mode, roles: { role: { text,
 * words: [{ form, lemma, sense, en, pos, features }], en, items? } }, score }], tokens } (items: a list cut at commas
 * and at the language's "and") with best null when no frame
 * takes every word (skip phrases aside).
 */
export function readFrames(world, text, { lang = 'w.lang.ro', morph: m, dictionary: dict, senses, max = 5 } = {}) {
  const norm = (s) => (m ? fold(m, String(s).toLowerCase()) : String(s).toLowerCase());
  const sense = senses ?? ((id) => senseOf(world, id));
  const raw = String(text).toLowerCase().replace(/[.!?;:"“”()]+/g, ' ').replace(/,/g, ' , ').split(/\s+/).filter(Boolean);
  let toks = raw.flatMap((t) => (t === ',' ? [t] : m ? splitClitics(m, t) : [t]));
  const items = (type, name) => world.ofType(type).filter((x) => bare(x.attrs.name?.[0]) === name).flatMap((x) => (x.attrs.item || []).map((i) => norm(bare(i)).split(/\s+/)));
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
      memo.set(i, as.map((a) => { const e = dict?.lookup(a.lemma); const s = sense(e?.sense ?? (m ? undefined : a.lemma)); return { form: toks[i], lemma: a.lemma, sense: e?.sense ?? (s.act || s.en ? a.lemma : null), en: s.en ?? null, act: s.act ?? null, pos: s.pos ?? null, features: a.features }; }));
    }
    return memo.get(i);
  };
  const seqAt = (i, seq) => seq.length && seq.every((x, j) => F[i + j] === x);
  const frames = world.ofType(`${lang}.frame`).map((f) => ({ name: bare(f.attrs.name[0]), en: bare(f.attrs.en?.[0] ?? ''), act: bare(f.attrs.act?.[0] ?? ''), mode: f.attrs.mode ? bare(f.attrs.mode[0]) : null, priority: Number(bare(f.attrs.priority?.[0] ?? 0)) }));
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
      else if (p.is === 'verb') { const want = bare(a.act?.[0]); r = ti < toks.length && readings(ti).some((x) => x.act === want) ? take(1, { _verb: readings(ti).find((x) => x.act === want) }) : null; }
      else if (p.is === 'role') {
        const role = bare(a.role[0]), takes = bare(a.takes?.[0] ?? 'words'), most = Number(bare(a.max_words?.[0] ?? 99));
        if (takes === 'number') { if (ti < toks.length && (nums.has(F[ti]) || /^\d+$/.test(F[ti]))) r = take(1, { [role]: { text: toks[ti], value: nums.get(F[ti]) ?? Number(F[ti]) } }); }
        else if (takes === 'prep') { if (ti < toks.length && preps.has(F[ti])) r = take(1, { [role]: { text: toks[ti], rel: preps.get(F[ti]) } }); }
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
    out.push({ frame: fr.name, en: fr.en, act: fr.act, mode: fr.mode, roles, ...(verb ? { verb: { form: verb.form, lemma: verb.lemma, en: verb.en } } : {}), score: fr.priority + known + parts.filter((p) => !p.optional).length / 10 });
  }
  const ranked = choose(world, 'frame', out, { seed: null }).order; // one way to choose (std.decide kind frame)
  return { best: ranked[0] ?? null, frames: ranked.slice(0, max), tokens: toks };
}
