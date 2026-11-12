// Reading frames into candidate wires (Round 9). A frame is the host's: it produces it
// (tokens, lemmas, a parser or a model); the library maps its words through
// core.word facts, the matrix and the state into candidates that world.score judges.
// Nothing is invented: every value in a candidate comes from a word or a number of the
// frame; defaults are left for score to report as assumptions.
//
//   @w core.word text=book means=reserve            an action
//   @w core.word text=order means=order              a type
//   @w core.word text=with means=meeting.with        a key (type.key)
//   @w core.word text=monday means=mon of=meeting.day a value of a slot
//
// One word wire, one meaning; a text with two meanings is two wires, and choosing between
// them is what score does. The words of a world are in one language, the one its matrix is
// written in: translation is the host's, outside the world.

import { quote, str } from './parser.mjs';

const WORD = 'core.word';
const first = (w, k) => w.attrs[k]?.[0];
const norm = (t) => String(t).trim().toLowerCase();

/** Edit distance with adjacent transpositions, stopping once it exceeds max (bounded). */
export function editDistance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { // bounded: the length of a word
    const cur = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
      cur.push(d);
      if (d < low) low = d;
    }
    if (low > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[b.length];
}
/** How far a word may be from a known one: 1 for short words (4 letters or fewer), else 2. */
const reach = (w) => (w.length <= 4 ? 1 : 2);

export const interpreting = {
  /**
   * The words of the world: text -> [{ id, means, of, meanings }], each meaning one of
   * { kind: 'action', name } | { kind: 'type', type } | { kind: 'key', type, key } |
   * { kind: 'value', type, key, value }. A word whose `means=` names nothing has no
   * meanings (and is reported in warnings).
   */
  words() {
    const out = new Map();
    for (const id of this.byType.get(WORD) || []) {
      const w = this._peek(id);
      const entry = { id, means: first(w, 'means'), of: first(w, 'of') };
      entry.meanings = this._meaningsOf(entry.means, entry.of);
      // several text= are several forms of one word (plural, an attached article, ...); a quoted text is its content
      for (const text of new Set((w.attrs.text || ['']).map((t) => norm(str(t))))) (out.get(text) || out.set(text, []).get(text)).push(entry);
    }
    return out;
  },

  /**
   * The word entries for a token: the token's own, else those of the dictionary forms the
   * host's lemma function gives (`lemma: fn`, or `register('lemma', fn)`). The
   * contract: fn(token) is pure, returns a string or a list of strings (forms to look
   * up; the token itself may be among them) and knows nothing of the world. A token that
   * is a known word is never lemmatized.
   */
  _lookup(token, lexicon) {
    const text = norm(token);
    const own = lexicon.get(text);
    if (own?.length) return own;
    const fn = this.lemma;
    if (!fn) return [];
    const forms = [].concat(fn(token) ?? []).map(norm).filter((f) => f && f !== text);
    const out = [];
    for (const f of new Set(forms)) for (const e of lexicon.get(f) || []) if (!out.includes(e)) out.push(e); // bounded: the forms of one token
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
    const entries = this._lookup(word, lexicon);
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
   * { verb, args: [word | { word, role }], numbers, question, mode }: `role` is a
   * word for a key (`with`, `on`) that places the argument; `question` asks instead of
   * telling. Returns { candidates, unresolved, dropped }: each candidate has `reading`
   * (which word went where), `used`, `unused` (words with a meaning left out of this
   * reading) and `unresolved` (words with no meaning at all), plus wires/refer, action/args
   * or question. At most `limit` candidates (default 50); `dropped` counts the rest.
   *
   * One message may be several frames ("book the pen and order ink"). A list of frames is
   * one split; a list of lists is alternative splits of the same message. A frame of a
   * split with no verb ("buy two pens and one ink") is read as a follow-up of the frame
   * before it: it takes its verb, and its own words replace the ones for the same slots. Each candidate
   * is then `{ parts, split }`: one reading per frame (new wires are `new1`, `new2`, ...),
   * judged by score in order, each part on the world with the parts before it.
   */
  interpret(frame, opts = {}) {
    if (opts._inner) return this._interpret(frame, opts);
    return this._guard(opts, () => this._interpret(frame, { ...opts, _inner: true, budget: undefined }), (v) => ({ candidates: [], unresolved: [], dropped: 0, budget: v }));
  },

  _interpret(frame, opts) {
    if (Array.isArray(frame)) return this._interpretSplits(frame, opts);
    if (frame.words) return this._interpretLoose(frame, opts);
    if (opts.previous && !opts._follow && (frame.verb === undefined || !(frame.args?.length || frame.numbers?.length) || frame.anaphor || frame.correction || frame.other)) return this._interpretFollow(frame, opts);
    const follow = opts._follow || null;
    const limit = opts.limit ?? 50;
    const ns = frame.ns ?? opts.ns;
    const lexicon = this.words();
    const c = this._compiled();
    const args = (frame.args || []).map((a) => (typeof a === 'string' ? { word: a } : a));
    const unresolved = [];
    const items = []; // { word, readings, role }
    for (const a of args) {
      const readings = this._readingsOf(a.word, lexicon, ns);
      let role = null;
      if (a.role !== undefined) {
        role = this._lookup(a.role, lexicon).flatMap((e) => e.meanings).filter((m) => m.kind === 'key');
        if (!role.length) unresolved.push(a.role);
      }
      if (!readings.length && opts.near !== false) readings.push(...this._nearReadings(a.word, lexicon, ns, false));
      if (!readings.length) unresolved.push(a.word);
      items.push({ word: a.word, readings, role });
    }
    for (const n of frame.numbers || []) items.push({ word: String(n), readings: [{ kind: 'number', value: String(n) }], role: null });
    // a follow-up: the previous frame's words come after this frame's, so what this frame states takes their place
    for (const a of follow?.args || []) {
      const x = typeof a === 'string' ? { word: a } : a;
      const role = x.role === undefined ? null : this._lookup(x.role, lexicon).flatMap((e) => e.meanings).filter((m) => m.kind === 'key');
      items.push({ word: x.word, readings: this._readingsOf(x.word, lexicon, ns), role, inherited: true });
    }
    for (const n of follow?.numbers || []) items.push({ word: String(n), readings: [{ kind: 'number', value: String(n) }], role: null, inherited: true });
    const verbs = opts._verbs ? opts._verbs.slice() : frame.verb === undefined ? [] : this._lookup(frame.verb, lexicon).flatMap((e) => e.meanings.map((m) => ({ ...m, word: e.id })));
    if (frame.verb !== undefined && !verbs.length && opts.near !== false) verbs.push(...this._nearReadings(frame.verb, lexicon, ns, true));
    if (frame.verb !== undefined && !verbs.length) unresolved.push(frame.verb);
    let verbNear = null; // the near reading of the verb in the candidates being built
    // a follow-up to the last told statement: what this frame states revises that wire
    if (follow?.told && frame.verb === undefined) verbs.push({ kind: 'type', type: follow.told.type, revise: follow.told.id });

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
      const lists = items.map((it) => it.readings.flatMap((r) => [].concat(placesOf(r, it)).filter(Boolean).map((p) => (r.near ? { ...p, near: r.near } : p))));
      const chosen = new Array(items.length).fill(null);
      const taken = new Set();
      const walk = (i) => {
        this._b?.tick('interpret');
        if (out.length >= limit) { dropped++; return; }
        if (i === items.length) return build(chosen.slice());
        let placed = false;
        for (const p of lists[i]) { // bounded: the places of one argument
          if (taken.has(p.slot) && (!p.many || (items[i].inherited && follow?.correction))) continue; // a correction replaces, even in a many slot
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
      cand.unused = items.filter((it, i) => !chosen[i] && it.readings.length && !it.inherited).map((it) => it.word);
      if (follow) {
        cand.inherited = { words: items.filter((it, i) => chosen[i] && it.inherited).map((it) => it.word) };
        if (follow.verb !== undefined) cand.inherited.verb = follow.verb;
        if (follow.told) cand.inherited.wire = follow.told.id;
        cand.replaced = items.filter((it, i) => !chosen[i] && it.inherited && it.readings.length).map((it) => it.word);
      }
      cand.unresolved = unresolved.slice();
      // words read as a near known word (a typo): an assumption score and rank count
      const near = [verbNear, ...chosen.map((p) => p?.near)].filter(Boolean);
      if (near.length) cand.assumes = near.map((n) => ({ word: n.word, read: n.read }));
      if (ns !== undefined) cand.ns = ns;
      if (frame.verb !== undefined) cand.verb = frame.verb;
      push(cand);
    };

    for (const v of frame.question ? [] : verbs) {
      verbNear = v.near || null;
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
          const attrs = [], refer = {}, values = {};
          chosen.forEach((p, i) => {
            if (!p) return;
            if (p.refer) {
              const name = `r${++n}`;
              // "the other one": a referent taken from the previous frame is not the one it resolved to
              refer[name] = items[i].inherited && follow?.other?.length ? { type: p.refer.type, not: follow.other } : p.refer; // another of the same type
              attrs.push(`${p.slot}=$${name}`); values[p.slot] = `$${name}`;
            } else { attrs.push(`${p.slot}=${this._quoteValue(p.value)}`); values[p.slot] = p.value; }
          });
          const cand = v.revise ? { revise: { id: v.revise, values } } : { wires: `@${opts.id || 'new'} ${v.type}${attrs.length ? ' ' + attrs.join(' ') : ''}` };
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
        verbNear = sk.near || null;
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

  /**
   * A follow-up ("no, a red one", "and the price?", "the other one", "make it yellow"):
   * a frame with no verb or no arguments, or marked by the host's front end as `anaphor` (a pronoun or
   * "one"), `correction` ("no, X") or `other` ("the other one"), read with the previous
   * frame. It inherits the verb, the question flag and the words the previous frame had;
   * what it states takes the place of what the previous frame said for the same slot (a
   * correction even in a many slot). `previous` is a frame, or { frame, ids } with the ids
   * the previous reading resolved to (for `other`), or 'told': the last told statement,
   * which the frame then revises ({ revise: { id, values } }). Candidates say what they
   * inherited (`inherited: { verb, words, wire }`) and which inherited words were replaced.
   */
  _interpretFollow(frame, opts) {
    const prev = opts.previous;
    const base = { ...opts, previous: undefined };
    if (prev === 'told' || prev.told) {
      const e = [...this.log].reverse().find((x) => x.op === 'tell' && x.facts?.length); // bounded: the log
      const w = e && this._peek(e.facts[e.facts.length - 1]);
      if (!w) return this.interpret(frame, base);
      return this.interpret(frame, { ...base, _follow: { told: { id: w.id, type: w.type }, correction: !!frame.correction } });
    }
    const p = prev.frame || prev;
    const defined = Object.fromEntries(Object.entries(frame).filter(([, v]) => v !== undefined));
    const merged = { ...p, ...defined, verb: frame.verb ?? p.verb, args: frame.args || [], numbers: frame.numbers || [] };
    return this.interpret(merged, { ...base, _follow: { args: p.args || [], numbers: p.numbers || [], verb: frame.verb === undefined ? p.verb : undefined, correction: !!frame.correction, other: frame.other ? prev.ids || [] : null } });
  },

  /**
   * Loose words ("pen two buy", "red house big"): a bag of words with no verb or order,
   * { words, numbers, question }. Each word that may be a verb (it means an action,
   * a type or a key, or is near one) is tried as the verb with the rest as arguments; then
   * each action and each type that has a word is tried as an implied verb (`implied`) with
   * all the words as arguments, kept only when it uses one. Candidates are those of
   * interpret, with `verbWord` or `implied`; score and rank order them by words used, and a
   * tie at the top is the host's cue to ask. Bounded by `limit` and by the budget
   * (site `interpret`).
   */
  _interpretLoose(frame, opts) {
    const limit = opts.limit ?? 50;
    const c = this._compiled();
    const lexicon = this.words();
    const words = frame.words.map(String);
    const out = [], seen = new Set(), unresolved = new Set();
    let dropped = 0;
    const add = (r, mark) => {
      dropped += r.dropped;
      r.unresolved.forEach((u) => unresolved.add(u));
      for (const cand of r.candidates) { // bounded: limit
        const key = JSON.stringify([cand.action, cand.args, cand.wires, cand.refer, cand.question]);
        if (seen.has(key)) continue;
        seen.add(key);
        if (out.length >= limit) { dropped++; continue; }
        out.push(Object.assign(cand, mark));
      }
    };
    const base = { numbers: frame.numbers, question: frame.question, mode: frame.mode, ns: frame.ns };
    words.forEach((w, i) => { // bounded: the words of one message
      this._b?.tick('interpret');
      const exact = this._lookup(w, lexicon).flatMap((e) => e.meanings);
      const verbish = exact.length ? exact.some((m) => m.kind !== 'value') : this._nearReadings(w, lexicon, frame.ns, true).length > 0;
      if (!verbish) return;
      add(this._interpret({ ...base, verb: w, args: words.filter((_, j) => j !== i) }, { ...opts, limit }), { verbWord: w });
    });
    // implied verbs: every action and every type that has a word
    const tools = new Map();
    for (const es of lexicon.values()) for (const e of es) for (const m of e.meanings) if (m.kind === 'action' || m.kind === 'type') tools.set(`${m.kind}:${m.name || m.type}`, m);
    for (const m of tools.values()) { // bounded: the tools of the matrix
      this._b?.tick('interpret');
      if (frame.question) break;
      const r = this._interpret({ ...base, args: words }, { ...opts, limit, _verbs: [m] });
      r.candidates = r.candidates.filter((x) => x.used.length > 0);
      r.unresolved = [];
      add(r, { implied: m.name || m.type });
    }
    // a word read as the verb is not left out
    for (const cand of out) if (cand.unresolved.length) cand.unresolved = cand.unresolved.filter((u) => u !== cand.verbWord);
    return { candidates: out, unresolved: [...unresolved].filter((u) => !out.some((x) => x.verbWord === u)), dropped };
  },

  /** Alternative splits of one message: every reading of every split, as compound candidates. */
  _interpretSplits(frames, opts) {
    const limit = opts.limit ?? 50;
    const splits = frames.length && frames.every(Array.isArray) ? frames : [frames];
    const out = [], unresolved = new Set();
    let dropped = 0;
    splits.forEach((split, s) => { // bounded: the splits the host gives
      // a frame of a split with no verb ("... and one ink") is a follow-up of the frame before it
      const per = split.map((f, i) => this.interpret(f, { ...opts, limit, id: `${opts.id || 'new'}${i + 1}`, ...(i > 0 && f.verb === undefined && !f.words ? { previous: split[i - 1] } : {}) }));
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

  /**
   * Example sentences, generated from the tools (actions, types with words,
   * keys with words), their slots and the words. The host gives the templates; the
   * library supplies what fills them. `templates` is { action, statement, question }, each
   * a string with {verb} and {args} (and {<key>} for one argument) or a function
   * ({ verb, args: [{ key, role, word, text }] }) => string; defaults '{verb} {args}' and
   * '{verb} {args}?'. An argument is written `role word` when its key has a word.
   *
   * Values come only from words (`means=<value> of=<type.key>`, enum values with a word)
   * and from names the world holds (identifying keys, `sample` wires per type, default 2);
   * a number slot takes its min (or 1), the one value not from a word. Each example is
   * { tool, text, frame, expect }: `frame` is what a host's front end should give
   * interpret for `text`, and `expect` the candidate it should then choose, so examples are
   * also tests of a lexicon. Options: `per` (examples per tool, default 3), `all` (every
   * slot with fillers, not only required ones), `sample`.
   */
  examples(templates = {}, opts = {}) {
    const c = this._compiled();
    const per = opts.per ?? 3, sample = opts.sample ?? 2;
    const lexicon = this.words();
    const once = new Set(); // a word with several forms is written in its first form
    const entries = [...lexicon.entries()].flatMap(([text, es]) => es.filter((e) => !once.has(e.id) && once.add(e.id)).flatMap((e) => e.meanings.map((m) => ({ text, ...m }))));
    const keyWord = (type, key) => entries.find((m) => m.kind === 'key' && m.type === type && m.key === key)?.text;
    const isA = (t, u) => t === u || c.isA(t, u);
    // what can fill a slot: [{ text, value, refer? }]
    const fillers = (type, key, s) => {
      if (s?.type) { // a wire: named by words for its identifying values, or by names the world holds
        const out = [];
        for (const k of c.idKeys.get(s.type) || []) {
          for (const m of entries) if (m.kind === 'value' && isA(m.type, s.type) && m.key === k) out.push({ text: m.text, value: m.value, refer: { type: s.type, where: { [k]: m.value } } });
          for (const id of [...(this.byType.get(s.type) || [])].slice(0, sample)) {
            const v = this._peek(id)?.attrs[k]?.[0];
            if (v !== undefined && !out.some((o) => o.value === v)) out.push({ text: v, value: v, refer: { type: s.type, where: { [k]: v } } });
          }
        }
        return out;
      }
      const words = entries.filter((m) => m.kind === 'value' && isA(type, m.type) && m.key === key).map((m) => ({ text: m.text, value: m.value }));
      if (words.length) return words;
      if (s && s.kinds.some((k) => k === 'integer' || k === 'number' || k === 'quantity')) {
        const v = s.attrs?.min?.[0] ?? '1';
        return [{ text: v, value: v, number: true }];
      }
      return [];
    };
    const fill = (tpl, verb, args) => {
      if (typeof tpl === 'function') return tpl({ verb, args });
      const one = (a) => (a.role ? `${a.role} ${a.text}` : a.text);
      return tpl.replace(/\{(\w+)\}/g, (all, name) => {
        if (name === 'verb') return verb;
        if (name === 'args') return args.filter((a) => !tpl.includes(`{${a.key}}`)).map(one).join(' ');
        const a = args.find((x) => x.key === name);
        return a ? one(a) : '';
      }).replace(/\s+/g, ' ').replace(/\s+([?.!,])/g, '$1').trim();
    };
    const out = [];
    // every combination of fillers, cut at `per`
    const combine = (slots, emit) => {
      let combos = [[]];
      for (const sl of slots) combos = combos.flatMap((cmb) => sl.fill.map((f) => [...cmb, { ...sl, ...f }])).slice(0, per);
      combos.forEach(emit);
    };
    const toFrame = (verb, args, extra = {}) => ({
      verb,
      args: args.filter((a) => !a.number).map((a) => (a.role ? { role: a.role, word: a.text } : a.text)),
      ...(args.some((a) => a.number) ? { numbers: args.filter((a) => a.number).map((a) => a.text) } : {}),
      ...extra,
    });
    for (const v of entries.filter((m) => m.kind === 'action')) {
      const a = c.actions.get(v.name);
      const slots = (a.params || []).map((p) => {
        for (const q of a.rule?.when || []) for (const [k, vs] of Object.entries(q.attrs)) if (vs.includes('?' + p)) {
          const s = c.slotOf(q.type, k);
          const fl = fillers(q.type, k, s?.type ? s : { ...(s || { kinds: [] }), type: c.idKeys.get(q.type)?.includes(k) ? q.type : undefined });
          return { key: p, role: keyWord(q.type, k), fill: fl.map((f) => ({ ...f, refer: undefined })) };
        }
        return { key: p, fill: [] };
      }).filter((sl) => sl.fill.length);
      combine(slots, (args) => out.push({
        tool: { kind: 'action', name: v.name }, text: fill(templates.action || '{verb} {args}', v.text, args),
        frame: toFrame(v.text, args), expect: { action: v.name, args: Object.fromEntries(args.map((x) => [x.key, x.value])) },
      }));
    }
    for (const v of entries.filter((m) => m.kind === 'type')) {
      const slots = [...(c.slots.get(v.type)?.values() || [])].filter((s) => !s.prefix && (opts.all || s.required))
        .map((s) => ({ key: s.key, role: keyWord(v.type, s.key), fill: fillers(v.type, s.key, s) })).filter((sl) => sl.fill.length);
      combine(slots, (args) => out.push({
        tool: { kind: 'type', type: v.type }, text: fill(templates.statement || '{verb} {args}', v.text, args),
        frame: toFrame(v.text, args),
        expect: { type: v.type, attrs: Object.fromEntries(args.filter((x) => !x.refer).map((x) => [x.key, x.value])), refer: Object.fromEntries(args.filter((x) => x.refer).map((x) => [x.key, x.refer])) },
      }));
    }
    for (const k of entries.filter((m) => m.kind === 'key')) {
      // a question about a key, of a wire named by an identifying value
      const ids = c.idKeys.get(k.type) || [];
      if (ids.includes(k.key) || !ids.length) continue;
      const about = fillers(k.type, ids[0], { type: k.type, kinds: [] });
      for (const f of about.slice(0, per)) {
        const args = [{ key: ids[0], text: f.text, value: f.value }];
        out.push({
          tool: { kind: 'question', type: k.type, key: k.key }, text: fill(templates.question || '{verb} {args}?', k.text, args),
          frame: toFrame(k.text, args, { question: true }), expect: { question: { type: k.type, where: f.refer.where, seek: k.key } },
        });
      }
    }
    return out;
  },

  /**
   * Readings of a word that is not known, through the nearest known words (a typo): words
   * within a bounded edit distance (1 for words of 4 letters or fewer, else
   * 2), only those at the smallest distance found. For a verb, words that mean an action,
   * a type or a key; for an argument, any word, an enum value, or a name the world holds
   * under an identifying key. Each reading carries near: { word, read }.
   */
  _nearReadings(word, lexicon, ns, verb) {
    const c = this._compiled();
    const text = norm(word), max = reach(text);
    let best = max + 1;
    const found = []; // [{ read, readings }]
    const consider = (read, make) => {
      if (read === text) return;
      const d = editDistance(text, read, Math.min(max, best));
      if (d > max || d > best) return;
      if (d < best) { best = d; found.length = 0; }
      found.push({ read, make });
    };
    for (const [t, es] of lexicon) { // bounded: the words of the world
      const ms = es.flatMap((e) => e.meanings.map((m) => ({ ...m, word: e.id })));
      if (verb && !ms.some((m) => m.kind !== 'value')) continue;
      consider(t, () => (verb ? ms.filter((m) => m.kind !== 'value') : this._readingsOf(t, lexicon, ns)));
    }
    if (!verb) {
      for (const n of this._names()) consider(norm(n.text), () => this._readingsOf(n.text, lexicon, ns)); // bounded: the names the world holds
    }
    const out = [], seen = new Set();
    for (const f of found) {
      for (const r of f.make()) {
        const key = JSON.stringify([r.kind, r.type, r.key, r.value, r.name, r.where]);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ ...r, near: { word, read: f.read } });
      }
    }
    return out;
  },

  /** The names a typo may be near: enum values and the values of identifying keys (kept per version). */
  _names() {
    if (this._namesAt?.version === this.version && this._namesAt.c === this._compiled()) return this._namesAt.list;
    const c = this._compiled();
    const list = [], seen = new Set();
    const add = (text) => { if (!seen.has(text)) { seen.add(text); list.push({ text }); } };
    for (const [type, mine] of c.slots.own) {
      for (const [key, s] of mine) {
        for (const v of s.enum || []) add(v);
        if (!s.identity) continue;
        for (const id of this.byType.get(type) || []) { const v = this._peek(id)?.attrs[key]?.[0]; if (v !== undefined && v[0] !== '$') add(v); } // bounded: the wires of a type
      }
    }
    this._namesAt = { version: this.version, c, list };
    return list;
  },

  _quoteValue(v) {
    return /^[A-Za-z0-9_.+-]+$/.test(v) ? v : quote(v);
  },
};
