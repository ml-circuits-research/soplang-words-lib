// Reading frames into candidate wires (Round 9). A frame is language-neutral: the host
// produces it (tokens, lemmas, a parser or a model); the library maps its words through
// core.word facts, the matrix and the state into candidates that world.score judges.
// Nothing is invented: every value in a candidate comes from a word or a number of the
// frame; defaults are left for score to report as assumptions.
//
//   @w core.word lang=en text=book means=reserve            an action
//   @w core.word lang=en text=order means=order              a type
//   @w core.word lang=en text=with means=meeting.with        a key (type.key)
//   @w core.word lang=en text=monday means=mon of=meeting.day a value of a slot
//
// One word wire, one meaning; a text with two meanings is two wires, and choosing between
// them is what score does.

import { quote } from './parser.mjs';

const WORD = 'core.word';
const first = (w, k) => w.attrs[k]?.[0];
const norm = (t) => String(t).trim().toLowerCase();

export const interpreting = {
  /**
   * The words of a language: text -> [{ id, means, of, meanings }], each meaning one of
   * { kind: 'action', name } | { kind: 'type', type } | { kind: 'key', type, key } |
   * { kind: 'value', type, key, value }. A word whose `means=` names nothing has no
   * meanings (and is reported in warnings).
   */
  words(lang) {
    const out = new Map();
    for (const id of this.byType.get(WORD) || []) {
      const w = this._peek(id);
      if (lang && first(w, 'lang') !== lang) continue;
      const text = norm(first(w, 'text') ?? '');
      const entry = { id, lang: first(w, 'lang'), means: first(w, 'means'), of: first(w, 'of') };
      entry.meanings = this._meaningsOf(entry.means, entry.of);
      (out.get(text) || out.set(text, []).get(text)).push(entry);
    }
    return out;
  },

  /** What a name in means= (with of=) stands for in the compiled matrix. */
  _meaningsOf(means, of) {
    const c = this._compiled();
    if (means === undefined) return [];
    if (of !== undefined) {
      const dot = of.lastIndexOf('.');
      const type = of.slice(0, dot), key = of.slice(dot + 1);
      const s = dot > 0 ? c.slotOf(type, key) : undefined;
      if (!s || (s.enum && !s.enum.includes(means))) return [];
      return [{ kind: 'value', type, key, value: means }];
    }
    const out = [];
    // a type: declared in the matrix, or one the world holds wires of; a key: a slot, or any key of such a type
    const known = (t) => !!(c.slots.get(t) || c.types.has(t) || (this.byType.get(t)?.size && !t.startsWith('core.')));
    if (c.actions.has(means)) out.push({ kind: 'action', name: means });
    const dot = means.lastIndexOf('.');
    if (dot > 0 && (c.slotOf(means.slice(0, dot), means.slice(dot + 1)) || known(means.slice(0, dot)))) out.push({ kind: 'key', type: means.slice(0, dot), key: means.slice(dot + 1) });
    if (known(means)) out.push({ kind: 'type', type: means });
    for (const [type, mine] of c.slots.own) for (const [key, s] of mine) if (s.enum?.includes(means)) out.push({ kind: 'value', type, key, value: means });
    return out;
  },

  /** A load warning for each word whose means= names nothing (all words, or these ids). */
  _checkWords(ids) {
    const list = ids ? ids.filter((id) => this._peek(id)?.type === WORD) : [...(this.byType.get(WORD) || [])];
    for (const id of list) {
      const w = this._peek(id);
      if (!w || this._meaningsOf(first(w, 'means'), first(w, 'of')).length) continue;
      if (this.warnings.some((x) => x.kind === 'unknown-word' && x.id === id)) continue;
      const of = first(w, 'of');
      this.warnings.push({ kind: 'unknown-word', id, why: `${id}: means=${first(w, 'means')}${of ? ` of=${of}` : ''} names no action, type, key or value of the matrix` });
    }
  },

  /** The readings of one argument of a frame: values, entities, keys, types. */
  _readingsOf(word, lexicon, ns) {
    const c = this._compiled();
    const text = norm(word);
    const out = [];
    const entity = (type, key, value) => {
      const ids = this._matching({ type, where: { [key]: value }, ns }).map((w) => w.id);
      if (ids.length) out.push({ kind: 'entity', type, where: { [key]: value }, ids });
    };
    const entries = lexicon.get(text) || [];
    for (const e of entries) {
      for (const m of e.meanings) {
        out.push({ ...m, word: e.id });
        if (m.kind === 'value' && c.slotOf(m.type, m.key)?.identity) entity(m.type, m.key, m.value);
      }
    }
    if (!entries.length) {
      // a word with no word wire: an entity it names by an identifying key, or an enum value spelled as is
      for (const [type, mine] of c.slots.own) {
        for (const [key, s] of mine) {
          if (s.identity) entity(type, key, word);
          if (s.enum?.includes(word)) out.push({ kind: 'value', type, key, value: word });
        }
      }
    }
    return out;
  },

  /**
   * Candidate readings of a frame, in the shapes world.score takes. A frame is
   * { lang, verb, args: [word | { word, role }], numbers, question, mode }: `role` is a
   * word for a key (`with`, `on`) that places the argument; `question` asks instead of
   * telling. Returns { candidates, unresolved, dropped }: each candidate has `reading`
   * (which word went where), `used`, `unused` (words with a meaning left out of this
   * reading) and `unresolved` (words with no meaning at all), plus wires/refer, action/args
   * or question. At most `limit` candidates (default 50); `dropped` counts the rest.
   *
   * One message may be several frames ("book the pen and order ink"). A list of frames is
   * one split; a list of lists is alternative splits of the same message. Each candidate
   * is then `{ parts, split }`: one reading per frame (new wires are `new1`, `new2`, ...),
   * judged by score in order, each part on the world with the parts before it.
   */
  interpret(frame, opts = {}) {
    if (Array.isArray(frame)) return this._interpretSplits(frame, opts);
    const limit = opts.limit ?? 50;
    const ns = frame.ns ?? opts.ns;
    const lexicon = this.words(frame.lang);
    const c = this._compiled();
    const args = (frame.args || []).map((a) => (typeof a === 'string' ? { word: a } : a));
    const unresolved = [];
    const items = []; // { word, readings, role }
    for (const a of args) {
      const readings = this._readingsOf(a.word, lexicon, ns);
      let role = null;
      if (a.role !== undefined) {
        role = (lexicon.get(norm(a.role)) || []).flatMap((e) => e.meanings).filter((m) => m.kind === 'key');
        if (!role.length) unresolved.push(a.role);
      }
      if (!readings.length) unresolved.push(a.word);
      items.push({ word: a.word, readings, role });
    }
    for (const n of frame.numbers || []) items.push({ word: String(n), readings: [{ kind: 'number', value: String(n) }], role: null });
    const verbs = frame.verb === undefined ? [] : (lexicon.get(norm(frame.verb)) || []).flatMap((e) => e.meanings.map((m) => ({ ...m, word: e.id })));
    if (frame.verb !== undefined && !verbs.length) unresolved.push(frame.verb);

    const out = [];
    let dropped = 0;
    const seen = new Set(); // one candidate per reading: a word read as a value and as the entity it names gives one
    const push = (cand) => {
      const key = JSON.stringify([cand.action, cand.args, cand.wires, cand.refer, cand.question]);
      if (seen.has(key)) return;
      seen.add(key);
      if (out.length < limit) out.push(cand); else dropped++;
    };
    const isA = (t, u) => t === u || c.isA(t, u);
    const numeric = (s) => s && s.kinds.some((k) => k === 'integer' || k === 'number' || k === 'quantity');
    const roleFits = (it, type, key) => !it.role || it.role.some((r) => isA(type, r.type) && r.key === key);

    // every way of giving each argument one place (a place takes one argument), bounded by limit
    const assign = (placesOf, build) => {
      const lists = items.map((it) => it.readings.flatMap((r) => placesOf(r, it)).filter(Boolean));
      const chosen = new Array(items.length).fill(null);
      const taken = new Set();
      const walk = (i) => {
        if (out.length >= limit) { dropped++; return; }
        if (i === items.length) return build(chosen.slice());
        let placed = false;
        for (const p of lists[i]) { // bounded: the places of one argument
          if (taken.has(p.slot) && !p.many) continue;
          placed = true;
          taken.add(p.slot); chosen[i] = p;
          walk(i + 1);
          taken.delete(p.slot); chosen[i] = null;
        }
        if (!placed) walk(i + 1); // nowhere to put it: left out, counted as unused
      };
      walk(0);
    };
    const finish = (cand, chosen) => {
      cand.reading = chosen.map((p, i) => (p ? { word: items[i].word, as: p.as } : null)).filter(Boolean);
      cand.used = cand.reading.map((r) => r.word);
      cand.unused = items.filter((it, i) => !chosen[i] && it.readings.length).map((it) => it.word);
      cand.unresolved = unresolved.slice();
      if (ns !== undefined) cand.ns = ns;
      if (frame.verb !== undefined) cand.verb = frame.verb;
      push(cand);
    };

    for (const v of frame.question ? [] : verbs) {
      if (v.kind === 'action') {
        const a = c.actions.get(v.name);
        const params = (a.params || []).map((p) => {
          for (const q of a.rule?.when || []) for (const [k, vs] of Object.entries(q.attrs)) if (vs.includes('?' + p)) return { p, type: q.type, key: k, slot: c.slotOf(q.type, k) };
          return { p };
        });
        assign((r, it) => params.map((pp) => {
          if (!pp.type || !roleFits(it, pp.type, pp.key)) return null;
          const at = { slot: pp.p, as: `${v.name}.${pp.p}` };
          if (r.kind === 'value' && isA(pp.type, r.type) && r.key === pp.key) return { ...at, value: r.value };
          if (r.kind === 'entity' && isA(r.type, pp.type) && r.where[pp.key] !== undefined) return { ...at, value: r.where[pp.key] };
          if (r.kind === 'number' && numeric(pp.slot)) return { ...at, value: r.value };
          return null;
        }), (chosen) => {
          const args = {};
          chosen.forEach((p) => { if (p) args[p.slot] = p.value; });
          finish({ action: v.name, args }, chosen);
        });
      }
      if (v.kind === 'type') {
        const slots = [...(c.slots.get(v.type)?.values() || [])].filter((s) => !s.prefix);
        let n = 0;
        assign((r, it) => slots.map((s) => {
          if (!roleFits(it, v.type, s.key)) return null;
          const at = { slot: s.key, many: s.many, as: `${v.type}.${s.key}` };
          if (s.type) { // a slot that holds a wire: a described referent
            if (r.kind === 'entity' && isA(r.type, s.type)) return { ...at, refer: { type: r.type, where: r.where } };
            return null;
          }
          if (r.kind === 'value' && isA(v.type, r.type) && r.key === s.key) return { ...at, value: r.value };
          if (r.kind === 'number' && numeric(s)) return { ...at, value: r.value };
          return null;
        }), (chosen) => {
          const attrs = [], refer = {};
          chosen.forEach((p) => {
            if (!p) return;
            if (p.refer) { const name = `r${++n}`; refer[name] = p.refer; attrs.push(`${p.slot}=$${name}`); }
            else attrs.push(`${p.slot}=${this._quoteValue(p.value)}`);
          });
          const cand = { wires: `@${opts.id || 'new'} ${v.type}${attrs.length ? ' ' + attrs.join(' ') : ''}` };
          if (Object.keys(refer).length) cand.refer = refer;
          finish(cand, chosen);
        });
      }
    }

    if (frame.question) {
      // what is asked: a key (the verb's or an argument's); about what: a type, an entity, values
      const seeks = [...verbs, ...items.flatMap((it) => it.readings)].filter((m) => m.kind === 'key');
      const types = [...verbs, ...items.flatMap((it) => it.readings)].filter((m) => m.kind === 'type').map((m) => m.type);
      const targets = seeks.length ? seeks : [...new Set(types)].map((type) => ({ kind: 'key', type, key: undefined }));
      for (const sk of targets) {
        assign((r, it) => {
          if (r.kind === 'key' && r === sk) return [{ slot: '\u0000seek', as: `seek ${sk.type}.${sk.key}` }];
          if (r.kind === 'type' && r.type === sk.type) return [{ slot: '\u0000type', as: `type ${r.type}` }];
          if (r.kind === 'entity' && isA(r.type, sk.type)) return [{ slot: '\u0000about', as: `about ${r.type}`, where: r.where }];
          if (r.kind === 'value' && isA(sk.type, r.type) && r.key !== sk.key) return [{ slot: r.key, as: `${r.type}.${r.key}`, where: { [r.key]: r.value } }];
          return [];
        }, (chosen) => {
          const where = Object.assign({}, ...chosen.filter((p) => p?.where).map((p) => p.where));
          const q = { type: sk.type, where };
          if (sk.key !== undefined) q.seek = sk.key;
          if (frame.mode) q.mode = frame.mode;
          else if (sk.key === undefined) q.mode = 'exists';
          finish({ question: q }, chosen);
        });
      }
    }
    return { candidates: out, unresolved, dropped };
  },

  /** Alternative splits of one message: every reading of every split, as compound candidates. */
  _interpretSplits(frames, opts) {
    const limit = opts.limit ?? 50;
    const splits = frames.length && frames.every(Array.isArray) ? frames : [frames];
    const out = [], unresolved = new Set();
    let dropped = 0;
    splits.forEach((split, s) => { // bounded: the splits the host gives
      const per = split.map((f, i) => this.interpret(f, { ...opts, limit, id: `${opts.id || 'new'}${i + 1}` }));
      for (const r of per) { r.unresolved.forEach((u) => unresolved.add(u)); dropped += r.dropped; }
      let combos = [[]];
      for (const r of per) combos = combos.flatMap((c) => (r.candidates.length ? r.candidates : [null]).map((x) => [...c, x]));
      for (const parts of combos) { // bounded: the product is cut at limit below
        if (out.length >= limit) { dropped++; continue; }
        const kept = parts.filter(Boolean);
        const cand = { parts: kept, split: s };
        cand.reading = kept.flatMap((p, i) => p.reading.map((x) => ({ ...x, part: i })));
        cand.used = kept.flatMap((p) => p.used);
        // a frame with no reading at all leaves all its words out
        cand.unused = parts.flatMap((p, i) => (p ? p.unused : (split[i].args || []).map((a) => (typeof a === 'string' ? a : a.word)).filter((w) => !per[i].unresolved.includes(w))));
        cand.unresolved = per.flatMap((r) => r.unresolved);
        out.push(cand);
      }
    });
    return { candidates: out, unresolved: [...unresolved], dropped };
  },

  _quoteValue(v) {
    return /^[A-Za-z0-9_.+-]+$/.test(v) ? v : quote(v);
  },
};
