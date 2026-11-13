// An index of sentence patterns by the words they need (Round 19). A host matcher that
// tries every pattern on every sentence spends its time on patterns that cannot match:
// most need a word the sentence does not have. A pattern is given as what it needs, a
// list of word sets (one word of each set must be in the sentence: a literal is a set of
// one, an alternative a set of several), with a kind; the index keeps each pattern under
// its rarest set and gives, for a sentence, only the patterns all of whose sets it meets,
// in the order they were added. The matching itself stays the host's. Zero dependencies.

/** @param {string} t */
const lower = (t) => String(t).toLowerCase();

export class PatternIndex {
  /**
   * @param {{ id: string, kind?: string, needs?: string[][] }[]} patterns
   * @param {{ normalize?: (word: string) => string }} options
   */
  constructor(patterns = [], { normalize = lower } = {}) {
    this.normalize = normalize;
    this.list = [];          // { id, kind, needs: Set[], at, value }
    this.byWord = new Map(); // word -> patterns anchored on a set holding it
    this.open = [];          // patterns that need no word: tried on every sentence
    this.freq = new Map();   // word -> how many patterns need it (any set)
    this.dirty = false;
    this.tried = 0;          // patterns given out for a sentence, over all calls
    this.queries = 0;
    for (const p of patterns) this.add(p);
  }

  /** Add a pattern; `value` is any host object handed back with it. */
  add({ id, kind, needs = [], ...rest }) {
    const sets = needs.map((s) => new Set((Array.isArray(s) ? s : [s]).map(this.normalize))).filter((s) => s.size);
    const p = { id, kind, needs: sets, at: this.list.length, ...rest };
    this.list.push(p);
    for (const s of sets) for (const w of s) this.freq.set(w, (this.freq.get(w) || 0) + 1);
    this.dirty = true;
    return this;
  }

  get size() { return this.list.length; }

  /** Anchor every pattern on the set whose words are needed by the fewest patterns. */
  _build() {
    this.byWord = new Map();
    this.open = [];
    for (const p of this.list) {
      if (!p.needs.length) { this.open.push(p); continue; }
      let best = null, cost = Infinity;
      for (const s of p.needs) {
        let c = 0;
        for (const w of s) c += this.freq.get(w) || 0;
        if (c < cost) { cost = c; best = s; }
      }
      for (const w of best) (this.byWord.get(w) || this.byWord.set(w, []).get(w)).push(p);
    }
    this.dirty = false;
  }

  /**
   * The patterns a sentence can match: every set they need has a word of the sentence.
   * `tokens` are its words (or a string, split on spaces); `kind` keeps only those kinds.
   */
  candidates(tokens, { kind } = {}) {
    if (this.dirty) this._build();
    const words = new Set((typeof tokens === 'string' ? tokens.split(/\s+/) : tokens).filter(Boolean).map(this.normalize));
    const kinds = kind === undefined ? null : new Set([].concat(kind));
    const seen = new Set(), out = [];
    const consider = (p) => {
      if (seen.has(p)) return;
      seen.add(p);
      if (kinds && !kinds.has(p.kind)) return;
      for (const s of p.needs) { let hit = false; for (const w of s) if (words.has(w)) { hit = true; break; } if (!hit) return; }
      out.push(p);
    };
    for (const w of words) for (const p of this.byWord.get(w) || []) consider(p);
    for (const p of this.open) consider(p);
    out.sort((a, b) => a.at - b.at);
    this.queries++;
    this.tried += out.length;
    return out;
  }

  /** How the index stands: patterns, anchor words, patterns that need no word, the average handed out per sentence. */
  stats() {
    if (this.dirty) this._build();
    return { patterns: this.list.length, words: this.byWord.size, open: this.open.length, perSentence: this.queries ? this.tried / this.queries : 0 };
  }
}
