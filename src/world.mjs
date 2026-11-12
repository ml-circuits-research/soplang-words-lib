// World: fact wires kept consistent with a consistency matrix.
//
// This file is the kernel: the store and its indexes, transactions, ingest, matching,
// the chase, validation and the withdrawal of wires, values and rule firings.
// Completion lives in complete.mjs, retraction and assumption revision in revise.mjs.

import { parse, format, cloneWire, quote, str } from './parser.mjs';
import { EMPTY, walk, unify, hasVar, isVar, bound } from './unify.mjs';
import { builtins, quantity, aggregates, canonical, jsonValue, canonicalJson, jsonAt } from './builtins.mjs';
import { cdcl } from './solve.mjs';
import { compileMatrix, localize, prefixModule, fitsKind, knownKind, readMap, SCHEMA_TYPES, LINKS } from './matrix.mjs';
import { completion } from './complete.mjs';
import { revision } from './revise.mjs';
import { querying } from './query.mjs';
import { interpreting } from './interpret.mjs';
import { timing } from './time.mjs';
import { Budget } from './budget.mjs';
import { tiering } from './tiers.mjs';
import { describing } from './describe.mjs';
import { abduce } from './abduce.mjs';
import { layer, CHECK } from './cow.mjs';

const first = (w, k) => w.attrs[k]?.[0];
const K = (type, key, value) => `${type}\u0001${key}\u0001${value}`;
// the keys through which a matrix wire names its patterns and templates
const NAMES = {
  'core.rule': LINKS, 'core.deny': LINKS, 'core.calc': ['over'], 'core.relation': ['when'],
  'core.action': ['when', 'with', 'if', 'set', 'add', 'remove'], 'core.aggregate': ['over', 'then', 'groups'],
};
// a variable in a reason, with an optional filter: ?n, ?n:ordinal
const SAY = /\?([A-Za-z_][\w.\-]*)(?::([A-Za-z_][\w\-]*))?/g;
const LIST = '\u0002'; // marks a list of values bound to one variable (the result of collect)
const TIES = '\u0003ties';
const NS = '?\u0005ns';
let VERSIONS = 0; // the last version given to a world of this process // the hidden variable that holds the namespace of a match // suffix of the hidden variable that holds the tied picks of an argmax or argmin

function readModule(map, w) {
  const read = (spec) => (spec === undefined ? [] : spec === 'id' ? [w.id] : w.attrs[spec] || []);
  return { name: read(map.fields.name || 'id')[0], imports: read(map.fields.imports) };
}

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** A short fingerprint of a text (FNV-1a, 32 bits, hex): to recognize a snapshot's base. */
function fingerprint(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } // bounded: the text
  return h.toString(16).padStart(8, '0');
}

export class World {
  constructor(options = {}) {
    const {
      fns = {}, library = {}, maxDepth = 12, maxSteps = 50000,
      lookahead = true, strict = false, searchBudget, rank = null, solver = cdcl(), vocabulary = {}, budget = {}, decimals, actions = {}, producers = {}, filters = {}, lemmas = {}, facts = {}, override = false, ns,
    } = options;
    this.options = { fns, actions, producers, filters, facts, override, ns, library, maxDepth, maxSteps, lookahead, strict, searchBudget, rank, solver, vocabulary, budget, decimals };
    this._cannot = null;          // reasons given by functions during a query (see cannot)
    this.warnings = [];           // things that still work and will not: { kind, id, why }
    this._reads = new WeakMap();  // bindings of a rule body -> the aggregated cells it read
    this._b = new Budget(budget && budget.steps, budget && budget.ms); // the budget of the call in progress (or of the last one)
    this._api = 0;                // depth of public calls: the outermost one owns the budget
    this._shared = null;          // set while this world shares its state with a fork
    this._logOf = new Map();      // fact id -> the log entry that told it
    this._fills = 0;              // number of fill entries in the log
    // Three kinds of host function, three registries: what a calc or a check calls (fns),
    // what an action runs (actions), what computes a key on demand (producers). A host
    // name never replaces a built-in by accident.
    this.fns = { ...builtins };
    this.actions = {};
    this.producers = {};
    // Facts the host keeps itself (a large static table): matched by patterns like wires,
    // never copied, forked or logged. facts[type](where) returns the wires of that type
    // whose keys have the given values (it may return more; patterns check every value).
    this.facts = { ...facts };
    this._external = new Map(); // id -> wire, of the facts providers returned (a cache: they are pure)
    this._version = ++VERSIONS; // see version
    this._nsUsed = false; // some fact is in a namespace: matches and identity stay inside one
    this.filters = {}; // how a reason writes a value: ?n:ordinal calls filters.ordinal(n); none built in, so no language is
    this.lemmas = {}; // lang -> fn(token) giving the dictionary forms of a token; none built in, so no language is
    for (const [name, fn] of Object.entries(filters)) this.register('filter', name, fn);
    for (const [lang, fn] of Object.entries(lemmas)) this.register('lemma', lang, fn);
    for (const [name, fn] of Object.entries(fns)) this.register('function', name, fn, { override });
    for (const [name, fn] of Object.entries(actions)) this.register('action', name, fn);
    for (const [name, fn] of Object.entries(producers)) this.register('producer', name, fn);
    this.wires = new Map();    // id -> fact wire
    this.byType = new Map();   // type -> Set<id>
    this.index = new Map();    // type|key|value -> Set<id>
    this.refs = new Map();     // id -> Set<id of wires that refer to it>
    this.matrix = new Map();   // id -> matrix wire
    this.alias = new Map();    // id of a merged wire -> id it was merged into
    this.used = new Set();     // matrix modules already loaded through core.use
    this.firings = new Map();  // signature -> { rule, from, made, fills, hits, s? }
    this.byWire = new Map();   // id -> Set<signature of firings that read or wrote the wire>
    this.byRule = new Map();   // rule id -> Set<signature>, for rules with negation
    this.log = [];             // what was told (replayable)
    this.events = [];          // history
    this.listeners = new Set();
    this.seq = 0;
    this.stamp = 0;            // identifies the current state; restored when a change is rolled back
    this._clock = 0;
    this._emitted = 0;
    this._journal = [];
    this._tx = 0;
    this._c = null;
  }

  // ---------------------------------------------------------------- reading

  get(id) { return this.wires.get(this.resolve(id)); }
  has(id) { return this.wires.has(this.resolve(id)); }
  resolve(id) {
    let x = id;
    while (this.alias.has(x)) x = this.alias.get(x); // bounded: a merged wire points at an older one, so chains end
    return x;
  }
  /** Wires of a type, including wires of the types that extend it. */
  /** A wire to read, not to change: no copy is made of a wire shared with a fork. */
  _peek(id) { const m = this.wires, rid = this.resolve(id); return (m.peek ? m.peek(rid) : m.get(rid)) || this._external.get(rid); }

  ofType(type) { return [...(this.byType.get(type) || [])].map((id) => this.wires.get(id)); }

  /**
   * What the matrix says about a type: what it extends, whether it is closed, and its keys
   * (own and inherited) with every attribute their wires carry (doc, ask, observe, ...).
   */
  schema(type) {
    const c = this._compiled();
    const decl = c.types.get(type);
    const slots = c.slots.get(type);
    if (!decl && !slots) return null;
    const one = (attrs) => Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, v.length === 1 ? v[0] : [...v]]));
    const keys = {};
    for (const [k, s] of slots || []) keys[k] = { ...one(s.attrs), of: s.of, key: k, required: s.required, many: s.many, inherited: s.of !== type, ...(s.combined ? { combined: s.combined } : {}) };
    // kinds the library does not check accept any literal; listing them lets a host see a typo
    const unknownKinds = [...(slots || [])].flatMap(([k, s]) => s.kinds.filter((kind) => !knownKind(kind)).map((kind) => ({ key: k, kind })));
    return { ...(decl ? one(decl.attrs) : {}), type, extends: c.parent.get(type) || null, lineage: [...c.lineage(type)], closed: c.closed.has(type), keys, unknownKinds };
  }

  /** Query with pattern wires. Returns one object of bindings per match. */
  ask(query, opts = {}) {
    if (this._compiled().lazyRules.length && !this._lazyOn) {
      return this._guard(opts, () => this._trial(() => { this._materialize(); this._lazyOn = true; try { return this.ask(query, { ...opts, budget: undefined }); } finally { this._lazyOn = false; } }), () => []);
    }
    if (opts.given) return this.check(opts.given, { ask: query }).rows || [];
    return this._guard(opts, () => {
      if (opts.at !== undefined) return this.asOf(opts.at, () => this.ask(query, { ns: opts.ns }));
      const pats = this._patterns(query);
      const out = [];
      // in a namespace: references without one are in it, and only its wires match
      if (opts.ns !== undefined) {
        const q = (id) => (id.includes('::') ? id.replace(/^::/, '') : opts.ns ? `${opts.ns}::${id}` : id);
        for (const p of pats) for (const k of Object.keys(p.attrs)) p.attrs[k] = p.attrs[k].map((v) => (v[0] === '$' && v[1] !== '?' ? '$' + q(v.slice(1)) : v));
      }
      const s0 = opts.ns !== undefined && this._nsUsed ? unify(NS, opts.ns, EMPTY) : EMPTY;
      for (const s of this._matchAll(pats, 0, s0)) {
        const row = {};
        for (const p of pats) if (!p.anonymous) row[p.id] = walk('?' + p.id, s);
        for (const k of bound(s)) if (!/^\?_\d+$/.test(k) && !k.includes('\u0005')) row[k.slice(1)] = walk(k, s);
        out.push(row);
      }
      return out;
    }, (budget) => Object.assign([], { budget }));
  }

  holds(query, opts = {}) {
    return this._guard(opts, () => {
      for (const _ of this._matchAll(this._patterns(query), 0, EMPTY)) return true;
      return false;
    }, () => false);
  }

  /**
   * For functions (fns): say why no result can be given, before returning nothing. A
   * query that finds no value because of it answers `unsupported` with this reason.
   */
  cannot(reason) { if (this._cannot) this._cannot.push(String(reason)); }

  /** A derived number in the precision the host asked for (option `decimals`, or a core.precision wire). */
  _round(out) {
    const d = this._c?.decimals ?? this.options.decimals;
    if (d === undefined || typeof out !== 'string') return out;
    const q = quantity(out);
    if (!q || Number.isInteger(q.n)) return out;
    return String(Number(q.n.toFixed(d))) + q.unit;
  }

  /**
   * Register a host function. kind 'function': called by calcs, checks and effects with
   * (args, world). kind 'action': run by a core.action with (context, args). kind
   * 'producer': called by a core.producer with (context). A function with the name of a
   * built-in is refused unless { override: true } (or a list of names) says it is meant.
   */
  register(kind, name, fn, { override = false } = {}) {
    if (typeof fn !== 'function') throw new Error(`sopworld: ${kind} "${name}" is not a function`);
    if (kind === 'function') {
      const meant = override === true || (Array.isArray(override) && override.includes(name));
      if ((Object.hasOwn(builtins, name) || Object.hasOwn(aggregates, name)) && !meant) throw new Error(`sopworld: the function "${name}" would replace the built-in of that name; rename it, or register it with { override: true }`);
      this.fns[name] = fn;
    } else if (kind === 'action') this.actions[name] = fn;
    else if (kind === 'producer') this.producers[name] = fn;
    else if (kind === 'filter') this.filters[name] = fn;
    else if (kind === 'lemma') this.lemmas[name] = fn; // name: a language, or '*' for any
    else throw new Error(`sopworld: unknown kind of function "${kind}"`);
    this._c = null; // a matrix that names it compiles now
    this._completed = null; // and what complete() found may change
    return this;
  }

  /** The function an action or producer names. One registered as a plain function still works, with a note. */
  _host(kind, name) {
    const own = (kind === 'action' ? this.actions : this.producers)[name];
    if (own) return own;
    const old = Object.hasOwn(builtins, name) ? undefined : this.fns[name];
    if (old && !this.warnings.some((x) => x.kind === 'deprecated' && x.id === name)) {
      this.warnings.push({ kind: 'deprecated', id: name, why: `"${name}" is used as ${kind === 'action' ? 'an action' : 'a producer'} but was registered among the functions: pass it as ${kind}s: { ${name} }` });
    }
    return old;
  }

  /** Steps counted by the last call, per site, and whether its budget ran out. */
  stats() { return this._b.report(); }

  /**
   * Run a public call under a budget. The outermost call owns it; calls made from inside
   * share it. If it runs out, everything the call did is undone and `onBudget` builds what
   * the caller gets: a `budget` violation in the shape of that call's normal result.
   */
  _guard(opts, fn, onBudget) {
    const top = this._api === 0;
    if (top) {
      // no spread: this runs on every call
      const own = opts && opts.budget, def = this.options.budget;
      this._b = new Budget(own && own.steps !== undefined ? own.steps : def && def.steps, own && own.ms !== undefined ? own.ms : def && def.ms);
    }
    const mark = this._journal.length, tx = this._tx;
    this._api++;
    try {
      return fn();
    } catch (e) {
      if (!top || !e || e !== this._b.signal) throw e;
      while (this._journal.length > mark) { this.stamp = this._journal.pop(); this._journal.pop()(); } // bounded: the journal of this call
      this._tx = tx;
      if (!tx) { this._journal.length = 0; this._emitted = this.events.length; }
      return onBudget(this._b.violation());
    } finally {
      this._api--;
      if (top) this._cannot = null;
    }
  }

  _refusal(v) {
    return { ok: false, added: [], derived: [], filled: [], merged: [], removed: [], violations: [v] };
  }

  /** Justification tree of a wire: who told it, or which rule derived it from what. */
  // bounded: each wire is expanded once (seen)
  explain(id, seen = new Set()) {
    const w = this.get(id);
    if (!w) return null;
    const node = { id: w.id, wire: format(w), told: !!w.meta.told, tier: this.tier(w.id) };
    if (w.meta.via) node.via = w.meta.via;
    if (w.meta.fills?.length) node.fills = w.meta.fills.map((f) => ({ ...f, tier: this.tier(w.id, f.key) }));
    if (seen.has(w.id)) return node;
    seen.add(w.id);
    const from = new Set(w.meta.from || []);
    for (const f of w.meta.fills || []) for (const x of f.from || []) from.add(x);
    from.delete(w.id);
    if (from.size) node.from = [...from].map((x) => this.explain(x, seen)).filter(Boolean);
    return node;
  }

  /** Serialise the facts (and optionally the matrix) back to SOP Lang. */
  toSOP({ schema = false, derived = true, provenance = false } = {}) {
    const lines = [];
    if (schema) for (const w of this.matrix.values()) lines.push(format(w));
    for (const w of [...this.wires.values()].sort((a, b) => a.meta.seq - b.meta.seq)) {
      if (!derived && !w.meta.told) continue;
      let line = format(w);
      if (provenance && w.meta.via) {
        line += ` core.via=$${w.meta.via}` + (w.meta.from || []).map((x) => ` core.from=$${x}`).join('');
      }
      lines.push(line);
    }
    return lines.join('\n');
  }

  history() { return [...this.events].map((e) => ({ ...e })); }

  /** Subscribe to committed events. Returns the function that unsubscribes. */
  on(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  /**
   * The facts as they were stated: each told wire with the values it was told with and
   * the values told for it later, and nothing a rule, a default or a search added.
   * Telling the result to a world with the same matrix gives the same world, and telling
   * it again to this one changes nothing. (For a state that was stated more than once
   * between events, the order of statements matters: use toJSON for those.)
   */
  told() {
    const out = new Map();
    const c = this._compiled();
    for (const e of this.log) { // bounded: the log
      if (e.op === 'tell') {
        for (const w of e.wires) {
          if (!e.facts.includes(w.id) || !this.has(w.id)) continue;
          out.set(w.id, cloneWire(w));
        }
      } else if (e.op === 'replace' && this.has(e.id)) {
        out.set(e.id, cloneWire(e.wire));
      } else if ((e.op === 'fill' || e.op === 'set') && !this._weakFill(e) && this.has(e.id)) {
        const w = [...out.values()].find((x) => this.resolve(x.id) === this.resolve(e.id));
        if (!w) continue;
        const key = c.shortKey(w.type, e.key);
        const replace = e.op === 'set' || [...c.fluents.values()].some((f) => f.key === key && c.isA(w.type, f.of));
        w.attrs[key] = replace ? [this._norm(e.value)] : [...(w.attrs[key] || []), this._norm(e.value)];
      }
    }
    return [...out.values()].map((w) => { const x = cloneWire(w); delete x.pattern; return x; });
  }

  /**
   * Replace a value that was told: revise(id, key, value), or revise(id, { key: value }).
   * One transaction: the old value goes with everything derived from it, the new one
   * comes with everything that follows. The result lists what gave way under `revised`.
   */
  revise(id, key, value, opts = {}) {
    const pairs = typeof key === 'object' && key !== null ? Object.entries(key) : [[key, value]];
    if (typeof key === 'object' && key !== null) opts = value || {};
    return this._guard(opts, () => this._patch({ sets: pairs.map(([k, v]) => ({ id, key: k, value: v })) }, opts), (v) => this._refusal(v));
  }

  /**
   * The world as data: its log. With { timeline: true } also the open marks and what redo
   * would tell again, so a host that restarts keeps undo, redo and rewind. A mark whose
   * log is a beginning of the world's log is written as its position (`at`, entries after
   * the start of what is written), any other as its own log. With { since: base }, a
   * world this one grew from (its log begins with the base's), only the entries after the
   * base's log are written, with a fingerprint of the base; World.fromJSON(data, { base })
   * restores it on a fork of that base.
   */
  toJSON(opts) {
    const since = opts && typeof opts === 'object' ? opts.since : undefined;
    const n = since ? since.log.length : 0;
    if (since && !this._startsWith(since.log)) throw new Error('toJSON: since= must be a world this one grew from (its log is not the beginning of this log)');
    const out = { format: 'sopworld', version: 1, log: this.log.slice(n).map((e) => ({ ...e })) };
    if (since) out.base = { length: n, last: n ? fingerprint(JSON.stringify(since.log[n - 1])) : null };
    if (opts && typeof opts === 'object' && opts.timeline) {
      out.timeline = {
        marks: (this._marks || []).map((m) => {
          const head = { ...(m.label !== undefined ? { label: m.label } : {}), seq: m.seq };
          const L = m.world.log.length;
          if (L >= n && this._startsWith(m.world.log)) return { ...head, at: L - n };
          if (since && L >= n && m.world._startsWith(since.log)) return { ...head, log: m.world.log.slice(n).map((e) => ({ ...e })) };
          return { ...head, log: m.world.log.map((e) => ({ ...e })), whole: true };
        }),
        redo: (this._redo || []).map((group) => group.map((e) => ({ ...e }))),
      };
    }
    return out;
  }

  /** Does this world's log begin with the given log? Entries are compared as objects, then as data. */
  _startsWith(log) {
    if (log.length > this.log.length) return false;
    for (let i = log.length - 1; i >= 0; i--) { // bounded: the log
      const a = log[i], b = this.log[i];
      if (a !== b && JSON.stringify(a) !== JSON.stringify(b)) return false;
    }
    return true;
  }

  /**
   * Rebuild a world from toJSON() output. Functions and the library are passed again.
   * Each entry of the log is replayed as its own call, under its own budget.
   */
  static fromJSON(data, options = {}) {
    if (data?.format !== 'sopworld') throw new Error('World.fromJSON: not a sopworld snapshot');
    const { base, ...rest } = options;
    let w;
    if (data.base) {
      // a delta: the base it was written against, forked (its functions and options come with it)
      if (!base) throw new Error('World.fromJSON: the snapshot was written with since=; pass the same base: fromJSON(data, { base })');
      const n = data.base.length;
      if (base.log.length !== n || (n && fingerprint(JSON.stringify(base.log[n - 1])) !== data.base.last)) throw new Error('World.fromJSON: the base given is not the one the snapshot was written against');
      w = base.fork();
    } else w = new World(rest);
    const fresh = () => (data.base ? base.fork() : new World(rest));
    // the log once, in order; a mark at a position is a fork taken when the replay gets there
    const marks = data.timeline?.marks || [];
    const at = marks.map((m, i) => [m.at, i]).filter(([p]) => p !== undefined).sort((a, b) => a[0] - b[0]);
    const made = new Array(marks.length);
    let done = 0;
    const replay = (to) => {
      const r = w._replay(data.log.slice(done, to));
      if (r) throw new Error('World.fromJSON: the snapshot is refused by the matrix: ' + JSON.stringify(r.violations[0]));
      done = to;
    };
    for (const [p, i] of at) { replay(p); made[i] = w.fork(); } // bounded: the marks
    replay(data.log.length);
    if (data.timeline) {
      w._marks = marks.map((m, i) => {
        let world = made[i];
        if (!world) { // a mark that is not on the way: its own log
          world = m.whole || !data.base ? new World(rest) : fresh();
          const r = world._replay(m.log);
          if (r) throw new Error('World.fromJSON: a mark of the snapshot is refused by the matrix: ' + JSON.stringify(r.violations[0]));
        }
        return { world, seq: m.seq, ...(m.label !== undefined ? { label: m.label } : {}) };
      });
      w._redo = data.timeline.redo.map((g) => g.map((e) => ({ ...e })));
    }
    return w;
  }

  // ---------------------------------------------------------------- writing

  /**
   * Add wires (SOP Lang text or wire objects): facts, matrix wires, or both.
   * Returns { ok, added, derived, filled, merged, removed, violations, revised? }.
   * Nothing changes when ok is false. { dry: true } evaluates and always rolls back;
   * { strict: true } also refuses a change that leaves no possible completion.
   */
  tell(input, opts = {}) {
    return this._guard(opts, () => {
      const r = this._tell(input, opts);
      return r.ok ? r : this._retryWithoutDefaults(r, (o) => this._tell(input, o), opts);
    }, (v) => this._refusal(v));
  }

  /** Answer an open key of an existing wire. Same contract as tell(). */
  fill(id, key, value, opts = {}) {
    return this._guard(opts, () => {
      const r = this._fill(id, key, value, opts);
      return r.ok ? r : this._retryWithoutDefaults(r, (o) => this._fill(id, key, value, o), opts);
    }, (v) => this._refusal(v));
  }

  /** tell() for set-up code: throws when the world refuses, so a broken matrix cannot go unnoticed. */
  load(input) {
    const r = this.tell(input);
    if (!r.ok) {
      const v = r.violations[0];
      throw new Error(`sopworld: refused (${v.kind}) ${v.why || JSON.stringify(v)}`);
    }
    return r;
  }

  /** Load a matrix module from the library given to the constructor. */
  use(name) { return this.tell([{ id: `use.${name}`, type: 'core.use', attrs: { world: [name] }, pattern: false }]); }

  /** Hypotheses that would make the goal pattern true. See abduce.mjs. */
  abduce(goal, opts = {}) { return this._guard(opts, () => abduce(this, goal, opts), (budget) => Object.assign([], { budget })); }

  /**
   * Would this patch be accepted? A patch is several changes that must hold together:
   * `{ wires, fills: [{ id, key, value }] }`, or just the list of fills. They are applied
   * in one scratch transaction, the rules run once, the result is validated once, and
   * everything is undone. No state in between is judged.
   */
  check(patch, opts = {}) {
    if (patch === undefined || patch === null) return this._guard(opts, () => this._audit(), (v) => ({ ok: false, violations: [v], issues: [] }));
    if (opts.query || opts.ask) {
      // evaluate on the world with the patch, and answer questions there; nothing stays
      return this._guard(opts, () => this._trial(() => {
        const r = this._patch(patch, { ...opts, query: undefined, ask: undefined });
        if (!r.ok) return r;
        if (opts.query) r.answer = this._query(opts.query, {});
        if (opts.ask) r.rows = this.ask(opts.ask);
        return r;
      }), (v) => this._refusal(v));
    }
    return this._guard(opts, () => this._patch(patch, { ...opts, dry: true }), (v) => this._refusal(v));
  }

  /**
   * Validate the whole world as it stands: every wire against its slots and every deny,
   * not only what the last change touched. Returns { ok, violations, issues }, where
   * issues are the standing soft violations (they do not make ok false).
   */
  _audit() {
    const res = this._result();
    const mark = this._begin(false);
    try {
      for (const id of this.wires.keys()) res._touched.add(id);
      res._full = true;
      res._all = true;
      this._validate(res);
      for (const v of res.violations) this._support(v);
    } finally {
      this._rollback(mark);
    }
    const issues = this.ofType('core.issue').map((i) => ({ id: i.id, rule: (i.attrs.rule || [])[0]?.slice(1), about: (i.attrs.about || []).map((v) => v.slice(1)), ...(i.attrs.key ? { key: i.attrs.key[0] } : {}), why: i.attrs.why ? str(i.attrs.why[0]) : undefined }));
    return { ok: !res.violations.length, violations: res.violations, issues };
  }

  /**
   * Check wires that come from somewhere else against a matrix: World.audit(wires,
   * matrix, options) returns { ok, violations, issues, world }. Nothing is kept unless
   * the caller keeps `world`.
   */
  static audit(wires, matrix, options = {}) {
    const world = new this(options);
    const m = matrix ? world.tell(matrix) : { ok: true, violations: [] };
    if (!m.ok) return { ok: false, violations: m.violations, issues: [], world };
    const r = world.tell(wires, { strict: false });
    if (!r.ok) return { ok: false, violations: r.violations, issues: [], world };
    return { ...world.check(), world };
  }

  /** Apply a patch (see check): all of it, or nothing. */
  applyPatch(patch, opts = {}) {
    return this._guard(opts, () => {
      const r = this._patch(patch, opts);
      return r.ok ? r : this._retryWithoutDefaults(r, (o) => this._patch(patch, { ...opts, ...o }), opts);
    }, (v) => this._refusal(v));
  }

  _patch(patch, { dry = false, strict = this.options.strict, via = 'core.tell', tier, ns = this.options.ns } = {}) {
    this._knownTier(tier);
    const { wires = [], fills = [], sets = [], retract = [], replace = [] } = Array.isArray(patch) ? { fills: patch } : patch || {};
    const ws = this._qualifyFacts((typeof wires === 'string' ? parse(wires) : wires).map(cloneWire), ns);
    const told = ws.map(cloneWire);
    const res = this._result();
    res._tier = tier;
    const mark = this._begin(!dry);
    let facts = [];
    const replaced = []; // { id, successor, gone }
    try {
      // replace in place: the wire keeps its id (and what refers to it) and gets these keys
      for (const r of [].concat(replace)) { // bounded: the replacements of one patch
        const target = this.wires.get(r.id);
        if (this.alias.has(r.id) || !target || !target.meta.told) { res.violations.push({ kind: 'unknown-wire', id: r.id, why: 'only told wires that were not merged can be replaced' }); continue; }
        const attrs = {};
        for (const [k, v] of Object.entries(r.attrs || {})) {
          attrs[k] = [].concat(v).map((x) => { x = String(x); return x[0] !== '"' && /[\s"\\]/.test(x) ? quote(x) : x; });
        }
        const wire = { id: r.id, type: r.type || target.type, attrs, pattern: false };
        const gone = this._unsay(res, [r.id], []); // no cascade: the new content takes the id
        this._ingest([cloneWire(wire)], res);
        replaced.push({ id: r.id, successor: wire, gone });
      }
      if (replaced.length && !res.violations.length) {
        // told wires that only meant the old content go with it; the others now refer to the new one
        this._chase(res);
        const orphans = [];
        for (const { gone } of replaced) for (const x of gone) {
          if (this.wires.has(x)) continue;
          for (const ref of this.refs.get(x) || []) {
            const w = this.wires.get(ref);
            if (!w || !this._dependsOn(w, x)) continue;
            if (w.meta.told) orphans.push(ref); else res._touched.add(ref);
          }
        }
        if (orphans.length && !res.violations.length) for (const x of this._withdraw(res, orphans, [])) res.removed.push(x);
      }
      if (ws.length) facts = this._ingest(ws, res);
      for (const f of fills) { // bounded: the fills of one patch
        const w = this.get(f.id);
        if (!w) { res.violations.push({ kind: 'unknown-wire', id: f.id }); continue; }
        this._merge(w, { [this._compiled().shortKey(w.type, f.key)]: [this._norm(String(f.value))] }, { via, from: [], tier }, res);
      }
      // a set replaces whatever the key held; a fill adds to it (and conflicts on a single-valued key)
      for (const f of sets) { // bounded: the sets of one patch
        const w = this.get(f.id);
        if (!w) { res.violations.push({ kind: 'unknown-wire', id: f.id }); continue; }
        const key = this._compiled().shortKey(w.type, f.key), value = this._norm(String(f.value));
        const old = (w.attrs[key] || []).filter((v) => v !== value);
        for (const v of old) (res._revised ||= []).push({ id: w.id, key, value: v, tier: this.tier(w.id, key) });
        if (old.length) this._unsay(res, [], old.map((v) => ({ id: w.id, key, value: v })));
        this._merge(w, { [key]: [value] }, { via, from: [], tier }, res);
      }
      let removed = [];
      if (retract.length && !res.violations.length) {
        const ids = retract.map((id) => this.resolve(id));
        for (const id of ids) if (!this.wires.has(id)) res.violations.push({ kind: 'unknown-wire', id });
        if (!res.violations.length) {
          removed = [...this._withdraw(res, ids, [])].filter((x) => !this.wires.has(x));
          this._logRemove(new Set(removed));
          this._event({ op: 'retract', ids: removed });
        }
      }
      this._settle(res, strict);
      if (removed.length) res.removed.push(...removed);
    } catch (e) {
      this._rollback(mark);
      throw e;
    }
    // in the log the parts of a patch carry the same group, so that a replay applies them together
    const group = fills.length + sets.length + replaced.length + (ws.length ? 1 : 0) > 1 ? `g${this.seq}` : undefined;
    res.added = res.added.filter((x) => !replaced.some((r) => r.id === x));
    const entries = [
      ...replaced.map((r) => ({ op: 'replace', id: r.id, wire: cloneWire(r.successor), ...(group ? { group } : {}), ...(tier ? { tier } : {}) })),
      ...(ws.length ? [{ op: 'tell', wires: told, facts, ...(group ? { group } : {}), ...(tier ? { tier } : {}) }] : []),
      ...fills.map((f) => ({ op: 'fill', id: f.id, key: f.key, value: String(f.value), via, ...(group ? { group } : {}), ...(tier ? { tier } : {}) })),
      ...sets.map((f) => ({ op: 'set', id: f.id, key: f.key, value: String(f.value), via, ...(group ? { group } : {}), ...(tier ? { tier } : {}) })),
    ];
    const done = this._finish(mark, res, dry, entries);
    if (done.ok && res._revised) done.revised = res._revised;
    if (done.ok && replaced.length) done.replaced = replaced.map((r) => r.id);
    return done;
  }

  /** Replay log entries on this world; entries of one patch go in together. Returns the first refusal, or null. */
  _replay(log, keep = (e) => e) {
    for (let i = 0; i < log.length; i++) { // bounded: the log
      const part = [log[i]];
      while (log[i].group !== undefined && log[i + 1]?.group === log[i].group) part.push(log[++i]); // bounded: the log
      const kept = part.map(keep).filter(Boolean);
      if (!kept.length) continue;
      const tell = kept.find((e) => e.op === 'tell');
      const fills = kept.filter((e) => e.op === 'fill'), sets = kept.filter((e) => e.op === 'set');
      const replace = kept.filter((e) => e.op === 'replace').map((e) => ({ id: e.id, type: e.wire.type, attrs: e.wire.attrs }));
      const r = this._patch({ wires: tell ? tell.wires : [], fills, sets, replace }, { strict: false, via: (fills[0] || sets[0])?.via, tier: (tell || fills[0] || sets[0] || kept[0]).tier });
      if (!r.ok) return r;
    }
    return null;
  }

  _tell(input, { dry = false, strict = this.options.strict, tier, ns = this.options.ns } = {}) {
    this._knownTier(tier);
    const wires = this._qualifyFacts((typeof input === 'string' ? parse(input) : input).map(cloneWire), ns);
    const told = wires.map(cloneWire); // the log keeps what was said, not what it grew into
    const res = this._result();
    res._tier = tier;
    const mark = this._begin(!dry);
    let facts;
    try {
      facts = this._ingest(wires, res);
      this._settle(res, strict);
    } catch (e) {
      this._rollback(mark);
      throw e;
    }
    return this._finish(mark, res, dry, { op: 'tell', wires: told, facts, ...(tier ? { tier } : {}) });
  }

  _fill(id, key, value, { dry = false, via = 'core.tell', strict = this.options.strict, tier } = {}) {
    this._knownTier(tier);
    const res = this._result();
    const mark = this._begin(!dry);
    try {
      const w = this.get(id);
      if (!w) res.violations.push({ kind: 'unknown-wire', id });
      else {
        key = this._compiled().shortKey(w.type, key);
        value = String(value);
        // an opaque value given as text is kept as a string value, whatever it contains
        if (value[0] !== '"' && this._compiled().blob(w.type, key)) value = quote(value);
        this._merge(w, { [key]: [this._norm(value)] }, { via, from: [], tier }, res);
        this._settle(res, strict);
      }
    } catch (e) {
      this._rollback(mark);
      throw e;
    }
    return this._finish(mark, res, dry, { op: 'fill', id, key, value: String(value), via, ...(tier ? { tier } : {}) });
  }

  /** Chase, validate, and in strict mode require that a completion still exists. */
  _settle(res, strict) {
    if (!res.violations.length) this._chase(res);
    if (!res.violations.length) this._validate(res);
    // validation may have written or removed issue wires (soft bounds): let the rules see them
    while (!res.violations.length && res._agenda.length) { this._chase(res); if (!res.violations.length) this._validate(res); } // bounded: issues change only when the wires they are about do
    if (!res.violations.length && strict && this.solveReport().status === 'unsat') {
      res.violations.push({ kind: 'dead-end', why: 'no consistent completion of the open keys exists' });
    }
  }

  // ---------------------------------------------------------------- transactions

  _result() {
    return { ok: true, added: [], derived: [], filled: [], merged: [], removed: [], violations: [], _touched: new Set(), _agenda: [], _fluents: new Map(), _types: new Set(), _seeds: new Map(), _full: false };
  }
  /** Open a transaction. `commit` says the caller intends to keep the changes: a state shared with a fork is copied first. */
  _begin(commit = false) { // eslint-disable-line no-unused-vars
    if (this._shared && this._tx === 0) this._detach();
    this._tx++;
    return this._journal.length;
  }
  _do(undo) {
    this._journal.push(undo, this.stamp);
    this.stamp = ++this._clock;
  }
  _rollback(mark) {
    while (this._journal.length > mark) { // bounded: the journal
      this.stamp = this._journal.pop();
      this._journal.pop()();
    }
    if (--this._tx === 0) { this._journal.length = 0; this._emitted = this.events.length; }
  }
  _commit() {
    if (--this._tx !== 0) return;
    if (this._shared) throw new Error('sopworld: internal error, a change was committed to a state shared with a fork');
    this._journal.length = 0;
    const fresh = this.events.slice(this._emitted);
    this._emitted = this.events.length;
    if (fresh.length) for (const l of this.listeners) l(fresh.map((e) => ({ ...e })), this);
    if (CHECK) this.fork(); // checking mode: the next change must not write what this state shares
  }

  /** What the caller gets of a result: the same lists without the working fields. */
  _bare(res) {
    const out = { ok: res.ok, added: res.added, derived: res.derived, filled: res.filled, merged: res.merged, removed: res.removed, violations: res.violations };
    // a change that was accepted with something wrong on record (a soft constraint) says so
    const issues = res.derived.map((id) => this.wires.get(id)).filter((w) => w && w.type === 'core.issue');
    if (issues.length) out.issues = issues.map((i) => this._issueOf(i));
    return out;
  }

  _finish(mark, res, dry, entry) {
    const ok = !res.violations.length;
    if (!ok) for (const v of res.violations) this._support(v); // before the evidence is rolled back
    if (!ok && res.violations.some((v) => v.priority !== undefined)) {
      // the deny with the lowest priority= first: the most specific reason leads
      const p = (v) => v.priority ?? Infinity;
      res.violations.sort((a, b) => (p(a) === p(b) ? 0 : p(a) < p(b) ? -1 : 1));
    }
    if (!ok || dry) {
      this._rollback(mark);
      if (!ok) return { ok, added: [], derived: [], filled: [], merged: [], removed: [], violations: res.violations };
    } else {
      for (const e of entry ? [].concat(entry) : []) this._logPush(e); // bounded: the entries of one call
      // the version moves only when the world changed: not for a statement that adds nothing
      if (res.added.length || res.derived.length || res.filled.length || res.removed.length || res.merged.length || res._revised || res._touchedChange) this._changed();
      if (res.added.length && this.byType.get('core.word')?.size) this._checkWords(res.added);
      this._commit();
    }
    res.ok = ok;
    return this._bare(res);
  }

  _transientEntry(e) {
    const c = this._compiled();
    if (!c.transient.size) return false;
    const isT = (type) => c.lineage(type).some((t) => c.transient.has(t));
    if (e.op === 'tell') return e.facts.length > 0 && e.facts.length === e.wires.length && e.wires.every((w) => isT(w.type));
    const w = this.wires.get(this.resolve(e.id));
    return !!w && isT(w.type);
  }

  /**
   * A token for the content of the world: equal in a world and a fork just made from it,
   * unchanged by a statement that adds nothing, and new (never seen before in this
   * process) after any change.
   */
  get version() { return this._version; }
  _changed() { const old = this._version; this._version = ++VERSIONS; this._do(() => { this._version = old; }); }

  _logPush(entry) {
    // a new statement makes what was undone final; looking around (transient state) does not
    if (this._redo?.length && !this._redoing && !this._transientEntry(entry)) {
      const redo = this._redo;
      this._redo = [];
      this._do(() => { this._redo = redo; });
    }
    if (this._mine && !this._mine.has(this.log)) { this.log = [...this.log]; this._mine.add(this.log); } // shared with a fork
    this.log.push(entry);
    if (entry.op === 'tell') for (const id of entry.facts) this._logOf.set(id, entry); // bounded: the facts of one tell
    else this._fills++;
    this._do(() => {
      this.log.pop();
      if (entry.op === 'tell') for (const id of entry.facts) this._logOf.delete(id);
      else this._fills--;
    });
  }

  /**
   * Take told facts out of the log (they were retracted), or put a successor in the place
   * of one. Only the entries that told those facts are touched.
   */
  _logRemove(dead, successor = null, replaced = null) {
    const old = this.log, oldFills = this._fills;
    let log = null;
    const undo = [];
    const point = (id, entry) => {
      const prev = this._logOf.get(id);
      undo.push(() => (prev ? this._logOf.set(id, prev) : this._logOf.delete(id)));
      if (entry) this._logOf.set(id, entry); else this._logOf.delete(id);
    };
    const entries = new Set();
    for (const id of dead) { const e = this._logOf.get(id); if (e) entries.add(e); }
    if (successor) { const e = this._logOf.get(successor.id); if (e) entries.add(e); }
    for (const e of entries) {
      log = log || old.slice();
      const i = log.indexOf(e);
      if (i < 0) continue;
      const wires = [];
      for (const w of e.wires) { // bounded: the wires of one tell
        const fact = e.facts.includes(w.id);
        if (fact && dead.has(w.id)) continue;
        wires.push(fact && successor && w.id === successor.id ? successor : w);
      }
      const facts = e.facts.filter((x) => !dead.has(x));
      for (const id of e.facts) if (dead.has(id)) point(id, null);
      if (wires.length) {
        const next = { ...e, wires, facts };
        log[i] = next;
        for (const id of facts) point(id, next);
      } else log.splice(i, 1);
    }
    if (this._fills) {
      const kept = (log || old).filter((e) => !((e.op === 'fill' && (dead.has(e.id) || e.id === replaced)) || (e.op === 'replace' && dead.has(e.id))));
      if (kept.length !== (log || old).length) { this._fills -= (log || old).length - kept.length; log = kept; }
    }
    if (!log) return;
    this.log = log;
    this._do(() => { this.log = old; this._fills = oldFills; for (let i = undo.length - 1; i >= 0; i--) undo[i](); });
  }

  /**
   * Name what a violation rests on: `support` lists the told wires behind it, so a refusal
   * can be explained in terms of what was said. `closure` (not enumerable) has every wire
   * involved and is what the solvers learn from.
   */
  _support(v) {
    const roots = [...(v.wires || []), ...(v.id ? [v.id] : [])];
    if (!roots.length) return;
    const seen = new Set(), told = [];
    while (roots.length) { // bounded: each wire is visited once
      const id = this.resolve(roots.pop());
      if (seen.has(id)) continue;
      seen.add(id);
      const w = this.wires.get(id);
      if (!w) continue;
      if (w.meta.told) told.push(id);
      for (const x of w.meta.from || []) roots.push(x);
      for (const f of w.meta.fills || []) for (const x of f.from || []) roots.push(x);
    }
    v.support = told;
    // the wires as they are now: after the change is undone some of them no longer exist
    v.involved = [...new Set((v.wires || []).concat(v.id ? [v.id] : []).map((x) => this.resolve(x)))].map((x) => this.wires.get(x)).filter(Boolean)
      .map((w) => ({ id: w.id, type: w.type, attrs: Object.fromEntries(Object.entries(w.attrs).map(([k, vals]) => [k, [...vals]])) }));
    Object.defineProperty(v, 'closure', { value: seen, enumerable: false });
  }

  /** Run fn against a scratch state; everything it does is undone. What-if questions go here. */
  trial(fn, opts = {}) { return this._guard(opts, () => this._trial(() => fn(this)), () => undefined); }

  _trial(fn) {
    const mark = this._begin();
    try { return fn(); } finally { this._rollback(mark); }
  }

  _event(e) {
    const prev = this.seq;
    e.seq = ++this.seq;
    this.events.push(e);
    this._do(() => { this.events.pop(); this.seq = prev; });
    return e.seq;
  }

  // ---------------------------------------------------------------- store primitives

  // Wires are indexed under their type and under every type it extends, so a pattern of an
  // ancestor type finds them without looking at the hierarchy again.
  _lineage(type) { return this._compiled().lineage(type); }

  /** The spelling a value is indexed under: canonical for a key that holds numbers, as given otherwise. */
  _iv(type, key, value) {
    const c = this._compiled();
    if (c.jsonKeys.size && c.json(type, key)) { const v = jsonValue(value); return v === undefined ? value : canonicalJson(v); }
    return c.numKeys.size && c.numeric(type, key) ? canonical(value) : value;
  }

  /** Are two values of a key the same value? */
  _same(type, key, a, b) {
    if (a === b) return true;
    const c = this._compiled();
    if (c.blobKeys.size && c.blob(type, key)) return false; // opaque values are the same only when equal
    if (c.jsonKeys.size && c.json(type, key)) { const x = jsonValue(a), y = jsonValue(b); return x !== undefined && y !== undefined && canonicalJson(x) === canonicalJson(y); }
    return c.numKeys.size > 0 && c.numeric(type, key) && canonical(a) === canonical(b);
  }

  _link(w, key, value) {
    const c = this._compiled();
    if (c.blobKeys.size && c.blob(w.type, key)) return; // opaque: not indexed
    const iv = this._iv(w.type, key, value);
    for (const t of this._lineage(w.type)) this._setOf(this.index, K(t, key, iv)).add(w.id);
    if (value[0] === '$') this._setOf(this.refs, value.slice(1)).add(w.id);
  }

  _unlink(w, key, value, whole) {
    const c = this._compiled();
    if (c.blobKeys.size && c.blob(w.type, key)) return;
    const iv = this._iv(w.type, key, value);
    for (const t of this._lineage(w.type)) this._setFor(this.index, K(t, key, iv))?.delete(w.id);
    if (value[0] !== '$') return;
    if (whole || !Object.values(w.attrs).some((vs) => vs.includes(value))) this._setFor(this.refs, value.slice(1))?.delete(w.id);
  }

  /** The index set of `k`, to add to: made if missing, copied first if this world shares it with a fork. */
  _setOf(map, k) {
    const s = map.get(k);
    if (!s) { const made = new Set(); map.set(k, made); this._mine?.add(made); return made; }
    if (!this._mine || this._mine.has(s)) return s;
    const own = layer(s);
    map.set(k, own);
    this._mine.add(own);
    return own;
  }

  /** The index set of `k`, to delete from, or undefined. */
  _setFor(map, k) { return map.has(k) ? this._setOf(map, k) : undefined; }

  _put(w) {
    this.wires.set(w.id, w);
    for (const t of this._lineage(w.type)) this._setOf(this.byType, t).add(w.id);
    for (const k of Object.keys(w.attrs)) for (const v of w.attrs[k]) this._link(w, k, v);
  }

  /** Rebuild the type indexes after the hierarchy, or the set of keys that hold numbers, changed. */
  _reindex() {
    const old = [this.byType, this.index];
    this.byType = new Map();
    this.index = new Map();
    for (const w of this.wires.values()) {
      for (const t of this._lineage(w.type)) {
        this._setOf(this.byType, t).add(w.id);
        for (const k of Object.keys(w.attrs)) if (!this._compiled().blob(w.type, k)) for (const v of w.attrs[k]) this._setOf(this.index, K(t, k, this._iv(w.type, k, v))).add(w.id);
      }
    }
    this._do(() => { [this.byType, this.index] = old; });
  }

  _drop(w) {
    this.wires.delete(w.id);
    for (const t of this._lineage(w.type)) this._setFor(this.byType, t)?.delete(w.id);
    for (const k of Object.keys(w.attrs)) for (const v of w.attrs[k]) this._unlink(w, k, v, true);
  }

  _addWire(w, meta, res) {
    w.meta = meta;
    this._stamp(w);
    this._put(w);
    this._do(() => this._drop(w));
    this._fluentNote(w, res);
    res._touched.add(w.id);
    res._agenda.push(w.id);
  }

  _removeWire(w) {
    this._drop(w);
    this._do(() => this._put(w));
  }

  _addValue(w, key, value, prov, res) {
    const fill = { key, value, via: prov.via, from: prov.from };
    if (prov.ties?.[key]) fill.ties = prov.ties[key];
    if (prov.tier) fill.tier = prov.tier;
    if (prov.cells) fill.cells = prov.cells;
    (w.attrs[key] ||= []).push(value);
    (w.meta.fills ||= []).push(fill);
    this._link(w, key, value);
    this._do(() => this._takeValue(w, key, value, fill));
    if (prov.rec) prov.rec.fills.push({ id: w.id, key, value });
    this._fluentTouch(w, res);
    this._event({ op: 'fill', id: w.id, key, value, via: prov.via, from: prov.from });
    res.filled.push({ id: w.id, key, value, via: prov.via });
    res._touched.add(w.id); // validated
    // propagated only if something reads the key: a value no pattern names changes no conclusion
    if (this._compiled().reads(w.type, key)) res._agenda.push(w.id);
  }

  _takeValue(w, key, value, fill) {
    const vs = w.attrs[key];
    vs.splice(vs.lastIndexOf(value), 1);
    if (!vs.length) delete w.attrs[key];
    if (fill) w.meta.fills.splice(w.meta.fills.indexOf(fill), 1);
    this._unlink(w, key, value, false);
  }

  _removeValue(w, key, value) {
    const fill = (w.meta.fills || []).find((f) => f.key === key && f.value === value);
    const at = fill ? w.meta.fills.indexOf(fill) : -1;
    this._takeValue(w, key, value, fill);
    this._do(() => {
      (w.attrs[key] ||= []).push(value);
      if (fill) w.meta.fills.splice(at, 0, fill);
      this._link(w, key, value);
    });
  }

  _indexFiring(sig, rec) {
    this.firings.set(sig, rec);
    for (const id of rec.ids) this._setOf(this.byWire, id).add(sig);
    if (rec.s) this._setOf(this.byRule, rec.rule).add(sig);
  }

  _unindexFiring(sig, rec) {
    this.firings.delete(sig);
    for (const id of rec.ids) this._setFor(this.byWire, id)?.delete(sig);
    if (rec.s) this._setFor(this.byRule, rec.rule)?.delete(sig);
  }

  _recordFiring(sig, rec) {
    rec.ids = [...new Set([...rec.from, ...rec.made, ...rec.hits, ...rec.fills.map((f) => f.id)])];
    this._indexFiring(sig, rec);
    this._do(() => this._unindexFiring(sig, rec));
  }

  _forgetFiring(sig) {
    const rec = this.firings.get(sig);
    if (!rec) return null;
    this._unindexFiring(sig, rec);
    this._do(() => this._indexFiring(sig, rec));
    return rec;
  }

  _norm(v) { return v[0] === '$' && v[1] !== '?' ? '$' + this.resolve(v.slice(1)) : v; }

  // ---------------------------------------------------------------- ingest

  /**
   * Classify and store the wires of one tell. Matrix wires go first, whatever their place
   * in the input, so that the facts told with them are read against the new matrix.
   * Returns the ids that are facts.
   */
  /**
   * Put the facts of a statement in a namespace: an id without one gets `ns::`, and so
   * does a reference without one (a reference resolves in its own namespace; another is
   * reached only when written out, `$other::x`, or `$::x` for the default one). Matrix
   * wires are not in namespaces. Changes the wires in place.
   */
  _qualifyFacts(wires, ns) {
    const written = wires.some((w) => w.id.includes('::') || Object.values(w.attrs).some((vs) => vs.some((v) => v[0] === '$' && v.includes('::'))));
    if (!ns && !written) return wires;
    const linked = new Set();
    for (const w of wires) { const keys = NAMES[w.type]; if (keys) for (const k of keys) for (const v of w.attrs[k] || []) if (v[0] === '$') linked.add(v.slice(1)); }
    const maps = this._compiled().maps;
    const q = (id) => (id.startsWith('::') ? id.slice(2) : id.includes('::') || !ns ? id : `${ns}::${id}`);
    let used = false;
    for (const w of wires) {
      if (w.pattern || SCHEMA_TYPES.has(w.type) || maps.has(w.type) || w.type === 'core.schema.map' || linked.has(w.id)) continue;
      w.id = q(w.id);
      if (w.id.includes('::')) used = true;
      for (const k of Object.keys(w.attrs)) w.attrs[k] = w.attrs[k].map((v) => (v[0] === '$' && v[1] !== '?' ? '$' + q(v.slice(1)) : v));
    }
    if (used && !this._nsUsed) { this._nsUsed = true; this._do(() => { this._nsUsed = false; }); }
    return wires;
  }

  /** The namespace of a wire id: what comes before ::, or '' for the default one. */
  _nsOf(id) { const i = id.indexOf('::'); return i < 0 ? '' : id.slice(0, i); }

  _ingest(wires, res) {
    const facts = [];
    // A wire belongs to the matrix (as a pattern or a template) when a rule, deny, calc,
    // relation or action told with it names it. A wire of the same id told on its own is
    // a fact: the two have separate id spaces.
    const linked = new Set();
    const noteLinks = (ws) => {
      for (const w of ws) {
        const keys = NAMES[w.type];
        if (keys) for (const k of keys) for (const v of w.attrs[k] || []) if (v[0] === '$') linked.add(v.slice(1));
      }
    };
    // wire types that a core.schema.map declares as schema, known before or told in this batch
    let maps = this._compiled().maps;
    let own = false;
    const note = (ws) => {
      noteLinks(ws);
      for (const w of ws) {
        if (w.type !== 'core.schema.map') continue;
        const m = readMap(w);
        if (!m.from) continue;
        if (!own) { maps = new Map(maps); own = true; }
        maps.set(m.from, m);
      }
    };
    note(wires);
    // facts and matrix wires have separate id spaces: a pattern @m1 of the matrix does not clash with a fact @m1
    for (const w of wires) if (w.legacy) this._deprecated(w.id);
    const isSchema = (w) => w.pattern || SCHEMA_TYPES.has(w.type) || maps.has(w.type) || linked.has(w.id);
    const load = (name, prefixed) => { // a module of the library, once
      if (this.used.has(name)) return;
      this.used.add(name);
      this._do(() => this.used.delete(name));
      const mod = parse(this.options.library[name]);
      const ws = prefixed ? prefixModule(mod, name) : mod.map(cloneWire);
      for (const w of ws) Object.defineProperty(w, 'module', { value: name, enumerable: false }); // which module said it
      note(ws);
      wires.push(...ws);
    };
    let schemaChanged = false;
    for (let i = 0; i < wires.length; i++) { // the list grows when a module is loaded
      const w = wires[i];
      if (!isSchema(w)) continue;
      if (this.matrix.has(w.id)) { res.violations.push({ kind: 'duplicate-id', id: w.id }); continue; }
      this.matrix.set(w.id, w);
      this._do(() => this.matrix.delete(w.id));
      schemaChanged = true;
      const map = maps.get(w.type);
      if (w.type === 'core.use') {
        const name = first(w, 'world');
        if (!name || !(name in this.options.library)) res.violations.push({ kind: 'schema', why: `${w.id}: no matrix named "${name}" in the library` });
        else load(name, first(w, 'prefix') !== 'false'); // prefix=false: the module's ids are already qualified
      } else if (map?.as === 'module' || w.type === 'core.module') { // a module that declares itself and what it imports
        const self = w.type === 'core.module' ? { name: first(w, 'name') || w.id, imports: w.attrs.imports || [] } : readModule(map, w);
        if (self.name && !this.used.has(self.name)) { this.used.add(self.name); this._do(() => this.used.delete(self.name)); }
        for (const name of self.imports) if (name in this.options.library) load(name, false);
      }
    }
    if (schemaChanged) {
      res._all = true; // a changed matrix is judged against everything, and says everything it finds
      const prev = this._c;
      this._c = null;
      this._do(() => { this._c = prev; });
      const c = this._compiled();
      for (const e of c.errors) res.violations.push({ kind: 'schema', why: e });
      for (const a of c.ambiguous) {
        if (this.warnings.some((x) => x.kind === 'ambiguous-key' && x.type === a.type && x.key === a.key)) continue;
        this.warnings.push({ kind: 'ambiguous-key', type: a.type, key: a.key, names: a.names, why: `on ${a.type}, the key ${a.key} is declared by modules ${a.modules.join(' and ')}: ${a.names.join(' and ')}` });
      }
      this._checkWords();
      for (const u of c.unknown) {
        if (this.warnings.some((x) => x.kind === 'unknown-attribute' && x.id === u.id && x.key === u.key)) continue;
        this.warnings.push({ kind: 'unknown-attribute', id: u.id, key: u.key, why: `${u.type} does not read "${u.key}" (on ${u.id})` });
      }
      for (const [name, mod] of c.modules) {
        for (const dep of mod.imports) {
          if (!c.modules.has(dep)) res.violations.push({ kind: 'schema', why: `module ${name} imports ${dep}, which is neither loaded nor in the library` });
        }
      }
      if (!prev || prev.hierarchy !== c.hierarchy || prev.numbers !== c.numbers || prev.blobs !== c.blobs) this._reindex();
      if ((prev ? prev.seqKey : undefined) !== c.seqKey) this._restamp();
      if (c.fluents.size || c.seqKey) for (const w of this.wires.values()) { if (w.meta.told) this._fluentNote(w, res); }
      res._agenda = [...this.wires.keys()];
      for (const id of res._agenda) res._touched.add(id);
      res._full = true;
    }
    const c = this._compiled();
    for (const w of wires) {
      if (isSchema(w)) continue;
      if (this.wires.has(w.id) || this.alias.has(w.id)) {
        // the same wire stated again, saying nothing new, is not an error: an export can be told back
        const have = this.get(w.id), c0 = this._compiled();
        const nothingNew = have.type === w.type && Object.keys(w.attrs).every((k) => {
          const key = c0.shortKey(w.type, k);
          return w.attrs[k].every((v) => (have.attrs[key] || []).some((x) => this._same(w.type, key, x, this._norm(v))));
        });
        if (!nothingNew) res.violations.push({ kind: 'duplicate-id', id: w.id });
        continue;
      }
      const attrs = {};
      let vars = false;
      for (const k of Object.keys(w.attrs)) { // short and full key names are one key
        const short = k.indexOf('.') < 0 ? k : c.shortKey(w.type, k);
        const into = attrs[short] || (attrs[short] = []);
        for (const raw of w.attrs[k]) {
          if (hasVar(raw)) vars = true;
          const v = raw[0] === '$' ? this._norm(raw) : raw;
          if (!into.includes(v)) into.push(v);
        }
      }
      if (vars) {
        res.violations.push({ kind: 'variable', id: w.id, why: 'a fact cannot contain a variable; a pattern or template is told together with the rule that names it' });
        continue;
      }
      w.attrs = attrs;
      facts.push(w.id);
      const same = this._findByIdentity(w.type, w.attrs, this._nsOf(w.id));
      if (same) {
        this._advance(w); // a statement about a wire that is already there happens at the place it declares
        if (res._tier && typeof res._tier === 'object') {
          for (const k of Object.keys(w.attrs)) this._merge(same, { [k]: w.attrs[k] }, { via: 'core.tell', from: [], tier: res._tier[k] }, res);
        } else this._merge(same, w.attrs, { via: 'core.tell', from: [], tier: res._tier }, res);
        this.alias.set(w.id, same.id);
        this._do(() => this.alias.delete(w.id));
        this._event({ op: 'merge', id: w.id, into: same.id });
        res.merged.push({ id: w.id, into: same.id });
      } else {
        const seq = this._event({ op: 'tell', id: w.id, wire: format(w) });
        let tiers = {};
        if (res._tier && typeof res._tier === 'object') {
          const own = Object.fromEntries(Object.entries(res._tier).filter(([k]) => w.attrs[this._compiled().shortKey(w.type, k)]).map(([k, t]) => [this._compiled().shortKey(w.type, k), t]));
          if (Object.keys(own).length) tiers = { keyTiers: own };
        } else if (res._tier) tiers = { tier: res._tier };
        this._addWire(w, { seq, told: true, depth: 0, ...tiers }, res);
        res.added.push(w.id);
      }
    }
    return facts;
  }

  _compiled() { return this._c || (this._c = compileMatrix(this)); }

  // ---------------------------------------------------------------- matching

  /** Note once per id that a pattern was declared the old way. */
  _deprecated(id) {
    if (this.warnings.some((x) => x.kind === 'deprecated' && x.id === id)) return;
    this.warnings.push({ kind: 'deprecated', id, why: `?${id} declares a pattern the old way: write @${id}; ? is for variables only` });
  }

  _patterns(query) {
    const ws = typeof query === 'string' ? parse(query, { anonymous: true }) : query;
    const locals = new Set(ws.map((w) => w.id));
    const c = this._compiled();
    return ws.map((w) => {
      if (w.legacy) this._deprecated(w.id);
      const p = localize(w, locals);
      if (w.anonymous) p.anonymous = true;
      if (p.attrs['core.select']) { p.select = p.attrs['core.select'][0]; delete p.attrs['core.select']; }
      if (p.attrs['core.absent']) { p.absent = p.attrs['core.absent'].map((key) => c.shortKey(p.type, key)); delete p.attrs['core.absent']; }
      for (const key of Object.keys(p.attrs)) { // full key names and short ones are the same key
        const short = c.shortKey(p.type, key);
        if (short !== key) { p.attrs[short] = [...(p.attrs[short] || []), ...p.attrs[key]]; delete p.attrs[key]; }
      }
      return c.paths(p);
    });
  }

  /**
   * Match one pattern against one wire. Keys with a single value (the usual case) are
   * unified in a plain loop; only a key with several values needs the branching generator.
   */
  *_matchWire(p, w, s, cross = false) {
    if (p.paths) { yield* this._matchPaths(p, w, s, cross); return; }
    if (p.type !== w.type && !this._compiled().isA(w.type, p.type)) return;
    // one match is in one namespace: wires joined by values are of the same namespace
    // (a wire reached by a written reference may be in another; shared types and a host's
    // facts are in all)
    if (this._nsUsed && !cross && !w.meta.external && !this._compiled().isShared(w.type)) {
      s = unify(NS, this._nsOf(w.id), s);
      if (!s) return;
    }
    if (p.absent) for (const k of p.absent) if (w.attrs[k]) return;
    s = unify('?' + p.id, w.id, s);
    if (!s) return;
    let pairs = p._pairs;
    if (!pairs) {
      pairs = [];
      for (const k of Object.keys(p.attrs)) for (const v of p.attrs[k]) pairs.push(k, v);
      Object.defineProperty(p, '_pairs', { value: pairs, enumerable: false });
    }
    for (let i = 0; i < pairs.length; i += 2) {
      const have = w.attrs[pairs[i]];
      if (!have) return;
      if (have.length !== 1) { yield* this._matchPairs(pairs, i, w, s); return; }
      s = this._unifyValue(w.type, pairs[i], pairs[i + 1], have[0], s);
      if (!s) return;
    }
    yield s;
  }

  /** A pattern that reads into structured values: the rest of the pattern, then each path. */
  *_matchPaths(p, w, s, cross) {
    let rest = p._noPaths;
    if (!rest) { rest = Object.create(p, { paths: { value: null } }); Object.defineProperty(p, '_noPaths', { value: rest, enumerable: false }); }
    next: for (let t of this._matchWire(rest, w, s, cross)) {
      for (const [key, path, pv] of p.paths) { // bounded: the paths of one pattern
        const v = jsonAt(w.attrs[key]?.[0], path);
        if (v === undefined) continue next;
        const u = unify(pv, v, t);
        if (u) { t = u; continue; }
        const want = walk(pv, t); // numbers compare as numbers
        if (hasVar(want) || canonical(want) !== canonical(v)) continue next;
      }
      yield t;
    }
  }

  /** Unify a pattern value with a wire value; under a key that holds numbers, 5 and 5.0 are equal. */
  _unifyValue(type, key, pv, have, s) {
    const t = unify(pv, have, s);
    if (t) return t;
    const c = this._c;
    if (!c || !c.numKeys.size || !c.numeric(type, key)) return null;
    const want = walk(pv, s);
    return !hasVar(want) && canonical(want) === canonical(have) ? s : null;
  }

  // bounded: one level per value of the pattern
  *_matchPairs(pairs, i, w, s) {
    if (i === pairs.length) { yield s; return; }
    const have = w.attrs[pairs[i]];
    if (!have) return;
    for (const fv of have) {
      const t = this._unifyValue(w.type, pairs[i], pairs[i + 1], fv, s);
      if (t) yield* this._matchPairs(pairs, i + 2, w, t);
    }
  }

  *_candidates(p, s) {
    if (p.select && !p._plain) { // one wire: the latest (or first) in sequence among those that match
      const plain = Object.create(p, { select: { value: undefined }, _plain: { value: true } });
      let best = null, bestWire = null;
      for (const t of this._candidates(plain, s)) {
        const w = this.wires.get(walk('?' + p.id, t));
        const d = bestWire ? this.compare(w.id, bestWire.id) : 0;
        if (!bestWire || (p.select === 'latest' ? d > 0 : d < 0)) { best = t; bestWire = w; }
      }
      if (best) yield best;
      return;
    }
    const idv = walk('?' + p.id, s);
    if (this.facts[p.type]) { yield* this._externalCandidates(p, s, idv); return; }
    if (!isVar(idv)) {
      const w = this.wires.get(this.resolve(idv));
      if (w) yield* this._matchWire(p, w, s, true);
      return;
    }
    // start from the smallest set: all wires of the type, or those having a value the pattern fixes
    let best = this.byType.get(p.type);
    if (!best) return;
    const c = this._c, numbers = !!c && c.numKeys.size > 0;
    for (const k of Object.keys(p.attrs)) {
      for (const v of p.attrs[k]) {
        const t = walk(v, s);
        if (hasVar(t)) continue;
        let set = this.index.get(K(p.type, k, t));
        if (numbers && c.numKeys.has(k)) {
          // a key that holds numbers in this type or in a subtype: those wires are under the canonical spelling
          const ct = canonical(t);
          if (ct !== t) {
            const other = this.index.get(K(p.type, k, ct));
            if (set && set.size && other && other.size) continue; // both spellings in use: this value does not narrow
            if (other && other.size) set = other;
          }
        }
        if (!set || !set.size) return;
        if (set.size < best.size) best = set;
      }
    }
    for (const id of best) { this._b.tick('match'); yield* this._matchWire(p, this.wires.get(id), s); }
  }

  /** Candidates from a host's provider of facts: asked with the values the pattern fixes. */
  *_externalCandidates(p, s, idv) {
    if (!isVar(idv)) {
      const w = this._external.get(idv);
      if (w) yield* this._matchWire(p, w, s);
      return;
    }
    const where = {};
    for (const k of Object.keys(p.attrs)) {
      const t = walk(p.attrs[k][0], s);
      if (!hasVar(t)) where[k] = t[0] === '"' ? str(t) : t;
    }
    const got = this.facts[p.type](where, this) || [];
    for (const raw of got) { // bounded: what the provider returned, each ticking the budget
      this._b.tick('match');
      const w = this._externalWire(p.type, raw);
      if (w) yield* this._matchWire(p, w, s);
    }
  }

  /** A provider's fact as a wire (read-only, kept in a cache by id). Values become tokens. */
  _externalWire(type, raw) {
    if (!raw || raw.id === undefined) return null;
    const id = String(raw.id);
    const known = this._external.get(id);
    if (known && known.type === type) return known;
    const attrs = {};
    for (const [k, v] of Object.entries(raw.attrs || raw)) {
      if (k === 'id' || k === 'attrs') continue;
      attrs[k] = [].concat(v).map((x) => { x = String(x); return x[0] === '"' || x[0] === '$' || !/[\s"\\]/.test(x) ? x : quote(x); });
    }
    const w = Object.freeze({ id, type, attrs, pattern: false, meta: Object.freeze({ external: true, told: true }) });
    this._external.set(id, w);
    return w;
  }

  // bounded: one level per pattern; the candidates tried at each level tick the budget
  *_matchAll(pats, i, s) {
    if (i === pats.length) { yield s; return; }
    for (const t of this._candidates(pats[i], s)) yield* this._matchAll(pats, i + 1, t);
  }

  _negated(rule, s) {
    for (const n of rule.not) if (!this._candidates(n, s).next().done) return true;
    return false;
  }

  /** Complete matches of a rule body: patterns, then calcs, tests and negated patterns. */
  *_bodies(rule, s0, skip) {
    if (rule.by?.length && rule.by.some((v) => hasVar(walk(v, s0)))) {
      // core.aggregate by=?v: one body per value of ?v among the matches of its patterns
      const seen = new Set();
      for (const t of this._matchAll(rule.calc[0].over, 0, s0)) {
        this._b.tick('aggregate');
        const key = rule.by.map((v) => walk(v, t)).join('\u0001');
        if (seen.has(key)) continue;
        seen.add(key);
        let s1 = s0;
        for (const v of rule.by) s1 = unify(v, walk(v, t), s1);
        if (s1) yield* this._bodies(rule, s1, skip);
      }
      // groups=: every declared group gets a body, members or not
      if (rule.groups) {
        for (const g of this._groupsOf(rule)) { // bounded: the declared groups
          this._b.tick('aggregate');
          if (seen.has(g)) continue;
          seen.add(g);
          const s1 = unify(rule.by[0], g, s0);
          if (s1) yield* this._bodies(rule, s1, skip);
        }
      }
      return;
    }
    const pats = skip < 0 ? rule.when : rule.when.filter((_, i) => i !== skip);
    next: for (let s of this._matchAll(pats, 0, s0)) {
      let reads = null;
      for (const c of rule.calc) {
        let out;
        if (c.over) { // an aggregate: every match of the patterns it ranges over, under the bindings so far
          const values = [], picks = [];
          // in sequence order, so that the result does not depend on how the indexes happen to be laid out
          const matches = [...this._matchAll(c.over, 0, s)].map((t) => [walk('?' + c.over[0].id, t), t]).sort((x, y) => this.compare(x[0], y[0]));
          const n = matches.length;
          for (const [, t] of matches) {
            this._b.tick('aggregate');
            for (const p of c.over) { // bounded: the patterns of one aggregate
              const ks = Object.keys(p.attrs), id = walk('?' + p.id, t);
              for (const k of ks.length ? ks : [null]) (reads ||= []).push([id, k]);
            }
            if (!c.args.length) break;
            const a = walk(c.args[0], t);
            if (hasVar(a)) continue;
            values.push(a);
            picks.push(walk(c.pick || '$?' + c.over[0].id, t));
          }
          if (!n && rule.by?.length && !(rule.groups && this._groupsOf(rule).includes(walk(rule.by[0], s)))) continue next; // a group with nothing in it has no result, unless declared
          if (c.rank) out = this._rankOf(c.rank, matches, s);
          else out = aggregates[c.fn](values, picks, n);
          if ((out === undefined || (!n && rule.groups)) && c.dflt !== undefined) out = c.dflt; // a declared group with no member takes default=
          if (Array.isArray(out)) out = LIST + out.join(LIST); // several values for one key
          // several wires share the best value: the pick is the first, the others are remembered
          if ((c.fn === 'argmax' || c.fn === 'argmin') && out !== undefined && c.ties !== 'first') {
            const best = aggregates[c.fn === 'argmax' ? 'max' : 'min'](values, picks, n);
            const tied = [...new Set(picks.filter((_, i) => values[i] === best || this.fns.eq([values[i], best], this)))];
            if (tied.length > 1 && c.ties === 'all') out = LIST + tied.join(LIST); // every best one, as several values
            else if (tied.length > 1) s = unify(c.out + TIES, LIST + tied.join(LIST), s);
          }
        } else {
          const args = c.args.map((a) => walk(a, s));
          if (args.some(hasVar)) continue next;
          out = this.fns[c.fn](args, this);
        }
        if (typeof out === 'number') out = String(out);
        out = this._round(out);
        if (out === undefined || out === null) continue next;
        s = unify(c.out, String(out), s);
        if (!s) continue next;
      }
      for (const t of rule.test) {
        const args = t.args.map((a) => walk(a, s));
        if (args.some(hasVar) || !this.fns[t.fn](args, this)) continue next;
      }
      if (this._negated(rule, s)) continue;
      if (reads) this._reads.set(s, reads);
      yield s;
    }
  }

  // ---------------------------------------------------------------- chase

  _chase(res) {
    const c = this._compiled();
    if (c.errors.length) return;
    let steps = 0;
    const fireAll = (rule, matches) => {
      for (const s of matches) {
        if (res.violations.length) return;
        this._b.tick('chase');
        if (++steps > this.options.maxSteps) {
          res.violations.push({ kind: 'budget', site: 'chase', steps, why: `more than ${this.options.maxSteps} rule firings` });
          return;
        }
        this._fire(rule, s, c, res);
      }
    };
    for (;;) {
      while ((res._agenda.length || res._fluents.size) && !res.violations.length) {
        this._b.tick('chase');
        if (res._fluents.size) { this._fluentRun(res, c); continue; } // states first: rules read their values
        const w = this.wires.get(res._agenda.shift());
        if (!w) continue;
        // a deny over a group needs the groups whose wires changed, even with no such rule
        if (!c.negRules.length && c.overByType.size) this._seed(w, res);
        if (c.negRules.length) { // only rules with negation, a selector or an aggregate need to know what changed
          for (const t of c.lineage(w.type)) res._types.add(t);
          this._seed(w, res);
          // a new or changed wire can end the absence that a rule with not= relied on
          for (const rule of c.forType(c.negByType, w.type)) {
            const stale = [...(this.byRule.get(rule.id) || [])].filter((sig) => this._negated(rule, this.firings.get(sig).s));
            if (stale.length) this._unsay(res, [], [], stale);
          }
        }
        for (const { rule, idx } of c.forType(c.ruleByType, w.type)) {
          const matches = [];
          for (const s0 of this._matchWire(rule.when[idx], w, EMPTY)) matches.push(...this._bodies(rule, s0, idx));
          fireAll(rule, matches);
        }
      }
      if (res.violations.length) return;
      // rules with negation or a selector are re-evaluated in full once everything else is quiet
      if (!c.negRules.length) { res._full = false; if (!res._agenda.length && !res._fluents.size) return; continue; }
      const changed = res._types;
      res._types = new Set();
      for (const rule of c.negRules) {
        this._b.tick('negation');
        if (rule.aggregate && !rule.hasSelect && !rule.not.length && !res._full) {
          // only the groups whose aggregated wires changed are looked at again
          const seeds = res._seeds.get(rule);
          res._seeds.delete(rule);
          for (const s0 of seeds ? seeds.values() : []) {
            const bodies = [...this._bodies(rule, s0, -1)];
            const now = new Set(bodies.map((s) => this._sig(rule, s)));
            const group = bound(s0).map((v) => [v, walk(v, s0)]);
            const stale = [...(this.byRule.get(rule.id) || [])].filter((sig) => {
              if (now.has(sig)) return false;
              const s = this.firings.get(sig).s;
              return group.every(([v, x]) => walk(v, s) === x);
            });
            if (stale.length) this._unsay(res, [], [], stale);
            fireAll(rule, bodies);
          }
          continue;
        }
        if (!res._full && !rule.types.some((t) => changed.has(t))) continue; // nothing it reads has changed
        const bodies = [...this._bodies(rule, EMPTY, -1)];
        if (rule.selective) { // what a selector picked may have changed: drop the firings that no longer hold
          const now = new Set(bodies.map((s) => this._sig(rule, s)));
          const stale = [...(this.byRule.get(rule.id) || [])].filter((sig) => !now.has(sig));
          if (stale.length) this._unsay(res, [], [], stale);
        }
        fireAll(rule, bodies);
      }
      res._full = false;
      if ((!res._agenda.length && !res._fluents.size) || res.violations.length) return;
    }
  }

  /**
   * core.rank: the position (from 1) of the wire `rank.of` matched among `matches` (the
   * wires of the same pattern with any value of the key), ordered by that key, as numbers
   * when both are numbers, else as times or text; equal values in sequence order.
   */
  _rankOf(rank, matches, s) {
    const me = walk(rank.of, s);
    const valueOf = (id) => this.wires.get(id)?.attrs[rank.key]?.[0];
    const ids = [...new Set(matches.map(([id]) => id))]; // in sequence order already
    const cmp = (a, b) => {
      const x = valueOf(a), y = valueOf(b);
      if (x === y) return 0;
      if (this.fns.lt([x, y], this)) return -1;
      if (this.fns.lt([y, x], this)) return 1;
      return x < y ? -1 : 1;
    };
    const sorted = ids.map((id, i) => [id, i]).sort((a, b) => (rank.order === 'desc' ? cmp(b[0], a[0]) : cmp(a[0], b[0])) || a[1] - b[1]);
    const at = sorted.findIndex(([id]) => id === me);
    return at < 0 ? undefined : String(at + 1);
  }

  /** The groups an aggregate with groups= declares: its values, and `$id` for each wire its patterns match. */
  _groupsOf(rule) {
    const out = [...rule.groups.values];
    for (const p of rule.groups.pats) for (const t of this._matchAll([p], 0, EMPTY)) out.push('$' + walk('?' + p.id, t)); // bounded: the wires a pattern matches
    return out;
  }

  /** Note the groups of the aggregates that a wire belongs to, so they are looked at again. Call before the wire changes. */
  _seed(w, res) {
    const c = this._c;
    if (!c || !c.overByType.size) return;
    for (const { rule, pat, group, groupsOf } of c.forType(c.overByType, w.type)) {
      if (groupsOf) { // the wire is a group of rule: its result is looked at again
        if (this._matchWire(pat, w, EMPTY).next().done) continue;
        const seeds = res._seeds.get(rule) || res._seeds.set(rule, new Map()).get(rule);
        seeds.set('$' + w.id + '\u0001', unify(groupsOf, '$' + w.id, EMPTY));
        continue;
      }
      for (const s of this._matchWire(pat, w, EMPTY)) {
        let s0 = EMPTY, key = '';
        for (const v of group) { const x = walk(v, s); s0 = unify(v, x, s0); key += x + '\u0001'; }
        const seeds = res._seeds.get(rule) || res._seeds.set(rule, new Map()).get(rule);
        seeds.set(key, s0);
      }
    }
  }

  _sig(rule, s) { return rule.id + '|' + rule.vars.map((v) => walk(v, s)).join('|'); }

  _fire(rule, s, c, res) {
    const sig = this._sig(rule, s);
    if (this.firings.has(sig)) return;
    const from = rule.when.map((p) => walk('?' + p.id, s));
    const depth = 1 + Math.max(0, ...from.map((id) => this.wires.get(id)?.meta.depth || 0));
    if (depth > this.options.maxDepth) {
      res.violations.push({ kind: 'depth', rule: rule.id, why: `derivation deeper than ${this.options.maxDepth}` });
      return;
    }
    const rec = { rule: rule.id, from, made: [], fills: [], hits: [] };
    if (rule.not.length || rule.selective) rec.s = s;
    // the cells this conclusion was read from: for each matched wire the keys its pattern names
    const cells = [];
    rule.when.forEach((p, i) => { const ks = Object.keys(p.attrs); if (ks.length) for (const k of ks) cells.push([from[i], k]); else cells.push([from[i], null]); });
    for (const x of this._reads.get(s) || []) cells.push(x);
    const prov = { via: rule.relation || rule.id, from, rec, cells, relation: !!rule.relation };
    for (const t of rule.then) {
      const attrs = {};
      prov.ties = undefined;
      for (const k of Object.keys(t.attrs)) {
        if (rule.soft && k === 'why') { attrs.why = [quote(this._say(str(t.attrs.why[0]), rule, s).text)]; continue; }
        for (const v of t.attrs[k]) { // bounded: the values of one template key
          const tied = isVar(v) ? walk(v + TIES, s) : v;
          if (tied[0] === LIST) (prov.ties ||= {})[k] = tied.slice(1).split(LIST);
        }
        const vals = t.attrs[k].map((v) => walk(v, s)).filter((v) => !hasVar(v)).flatMap((v) => (v[0] === LIST ? v.slice(1).split(LIST) : [v]));
        if (vals.length) attrs[k] = vals; // a value left unbound is an open key
      }
      const ns = this._nsUsed ? walk(NS, s) : '';
      const home = isVar(ns) ? '' : ns;
      let target = t.on ? this.wires.get(this.resolve(walk(t.on, s))) : this._findByIdentity(t.type, attrs, home) || this._findSubsuming(t.type, attrs, c, home);
      if (t.on && !target) continue;
      if (target) {
        rec.hits.push(target.id);
        this._merge(target, attrs, prov, res);
      } else {
        target = { id: `${home && !c.isShared(t.type) ? home + '::' : ''}_${t.id}_${hash(sig)}`, type: t.type, attrs, pattern: false };
        if (this.wires.has(target.id)) target.id += '_' + this.seq;
        const seq = this._event({ op: 'derive', id: target.id, wire: format(target), via: rule.id, from });
        this._addWire(target, { seq, via: rule.id, from, depth, cells, ...(prov.ties ? { ties: prov.ties } : {}) }, res);
        rec.made.push(target.id);
        res.derived.push(target.id);
      }
      s = unify('?' + t.id, target.id, s);
    }
    this._recordFiring(sig, rec);
  }

  /** Another wire of the type (in the same namespace) whose keys hold these values, or null. */
  _sharing(w, type, keys, values) {
    const c = this._compiled();
    const apart = this._nsUsed && !c.isShared(type);
    for (const id of this.index.get(K(type, keys[0], this._iv(type, keys[0], values[0]))) || []) {
      if (id === w.id || (apart && this._nsOf(id) !== this._nsOf(w.id))) continue;
      const o = this._peek(id);
      if (o && keys.every((k, i) => (o.attrs[k] || []).some((x) => this._same(type, k, x, values[i])))) return id;
    }
    return null;
  }

  // identity merges only inside one namespace, unless the type is shared
  _findByIdentity(type, attrs, ns = '') {
    const c = this._compiled();
    const keys = c.idKeys.get(type);
    if (!keys || !keys.every((k) => attrs[k])) return null;
    const apart = this._nsUsed && !c.isShared(type);
    for (const id of this.index.get(K(type, keys[0], this._iv(type, keys[0], attrs[keys[0]][0]))) || []) {
      if (apart && this._nsOf(id) !== ns) continue;
      const w = this.wires.get(id);
      if (keys.every((k) => w.attrs[k] && this._same(type, k, w.attrs[k][0], attrs[k][0]))) return w;
    }
    return null;
  }

  _findSubsuming(type, attrs, c, ns = '') {
    if (c.idKeys.get(type)?.every((k) => attrs[k])) return null;
    const keys = Object.keys(attrs);
    let best = this.byType.get(type);
    if (!best) return null;
    for (const k of keys) for (const v of attrs[k]) {
      const set = this.index.get(K(type, k, this._iv(type, k, v)));
      if (!set || !set.size) return null;
      if (set.size < best.size) best = set;
    }
    const apart = this._nsUsed && !c.isShared(type);
    for (const id of best) {
      if (apart && this._nsOf(id) !== ns) continue;
      const w = this.wires.get(id);
      if (keys.every((k) => w.attrs[k] && attrs[k].every((v) => w.attrs[k].some((x) => this._same(type, k, x, v))))) return w;
    }
    return null;
  }

  /** Add key/values to an existing wire; a different value on a single-valued key is a conflict. */
  _merge(w, attrs, prov, res) {
    const c = this._compiled();
    for (const k of Object.keys(attrs)) {
      for (const v of attrs[k]) {
        const have = w.attrs[k];
        // a relation states numbers: 5 and 5.0 agree, whatever the key is declared as
        if (have && (have.includes(v) || have.some((x) => this._same(w.type, k, x, v)) || (prov.relation && have.some((x) => this.fns.eq([x, v], this))))) continue;
        if (!prov.rec && this._fluentState(w, k, v, res)) continue; // a new statement about a state, not a conflict
        const slot = c.slotOf(w.type, k);
        // a bookkeeping key that no slot declares takes every value it is given: a wire told
        // again keeps the source, the place and so on of each statement
        if (have && !slot?.many && !(!slot && c.isOpenKey(k))) {
          res.violations.push({ kind: 'conflict', id: w.id, key: k, have: have[0], want: v, via: prov.via, wires: [w.id, ...prov.from] });
          continue;
        }
        this._addValue(w, k, v, prov, res);
      }
    }
  }

  // ---------------------------------------------------------------- withdrawal

  /**
   * Take back wires, values and rule firings, and everything that rested on them.
   * Over-deletes on purpose: every firing that read a removed or changed wire is undone and
   * its inputs are put back on the agenda, so the next chase re-derives what still holds.
   * Returns the ids removed. Does not chase.
   */
  _unsay(res, ids, values, sigs = []) {
    const gone = new Set();
    const queue = [];
    const requeue = (id) => { if (this.wires.has(id)) { res._agenda.push(id); res._touched.add(id); } };
    const kill = (id) => {
      const w = this.wires.get(id);
      if (!w) return;
      this._fluentTouch(w, res);
      this._seed(w, res);
      for (const t of this._lineage(w.type)) res._types.add(t);
      this._removeWire(w);
      this._event({ op: 'remove', id });
      gone.add(id);
      queue.push(id);
    };
    const unfill = ({ id, key, value }) => {
      const w = this.wires.get(id);
      if (!w || !w.attrs[key]?.includes(value)) return;
      this._seed(w, res);
      this._removeValue(w, key, value);
      this._fluentTouch(w, res);
      this._event({ op: 'unfill', id, key, value });
      queue.push(id);
      requeue(id);
    };
    const invalidate = (sig) => {
      const rec = this._forgetFiring(sig);
      if (!rec) return;
      rec.made.forEach(kill);
      rec.fills.forEach(unfill);
      rec.from.forEach(requeue);
    };
    ids.forEach(kill);
    values.forEach(unfill);
    sigs.forEach(invalidate);
    while (queue.length) {
      this._b.tick('withdraw');
      const id = queue.shift();
      for (const sig of [...(this.byWire.get(id) || [])]) {
        const rec = this.firings.get(sig);
        if (!rec) continue;
        if (rec.from.includes(id)) invalidate(sig);
        else { this._forgetFiring(sig); rec.from.forEach(requeue); } // it only wrote here: let it fire again
      }
    }
    res._agenda = res._agenda.filter((id) => this.wires.has(id));
    return gone;
  }

  // ---------------------------------------------------------------- validation

  /** Keep the standing issue of a soft bound: there while the value is out of bounds, gone when it is not. */
  _issue(w, key, bad, slot, res) {
    const id = `issue.${w.id}.${key}`;
    const have = this.wires.get(id);
    const why = bad ? quote(`${key} ${bad}`) : null;
    if (have && have.attrs.why[0] === why) return;
    if (have) this._unsay(res, [id], []);
    if (!bad) return;
    const wire = { id, type: 'core.issue', attrs: { rule: ['$' + slot.id], about: ['$' + w.id], key: [key], why: [why] }, pattern: false };
    const seq = this._event({ op: 'derive', id, wire: format(wire), via: slot.id, from: [w.id] });
    this._addWire(wire, { seq, via: slot.id, from: [w.id], depth: 1 }, res);
    res.derived.push(id);
  }

  /**
   * A reason with its variables filled in: "?m is not enough for ?t" becomes "10 is not
   * enough for 12". Returns { text, bindings } where bindings are the values of the
   * variables of the rule (as data, for a host that words the message itself).
   */
  _say(why, rule, s) {
    const bindings = {};
    for (const v of rule.vars || []) { const x = walk(v, s); if (!hasVar(x)) bindings[v.slice(1)] = x; }
    // the variables as data, for a host that words the message itself: not the ids of
    // the matched wires, strings as their text, plain numbers as numbers, several values
    // (collect, ties=all) as a list
    const pats = new Set((rule.when || []).map((p) => p.id));
    const one = (x) => (x[0] === '"' ? str(x) : /^-?\d+(\.\d+)?$/.test(x) ? Number(x) : x);
    const vars = {};
    for (const [k, x] of Object.entries(bindings)) {
      if (pats.has(k) || k.includes('\u0003')) continue;
      vars[k] = x[0] === LIST ? x.slice(1).split(LIST).map(one) : one(x);
      if (x[0] === LIST) bindings[k] = x.slice(1).split(LIST);
    }
    const some = (o) => (Object.keys(o).length ? o : undefined);
    if (typeof why !== 'string' || !why.includes('?')) return { text: why, bindings: some(bindings), vars: some(vars) };
    const text = why.replace(SAY, (m, name, filter) => {
      let n = name;
      while (n && bindings[n] === undefined && /[.\-]$/.test(n)) n = n.slice(0, -1); // bounded: the punctuation after a name
      if (bindings[n] === undefined) return m;
      const rest = name.slice(n.length);
      const plain = Array.isArray(bindings[n]) ? bindings[n].map(str).join(', ') : str(bindings[n]);
      if (!filter || rest) return plain + rest + (filter && rest ? `:${filter}` : '');
      const f = this.filters[filter];
      return f ? String(f(vars[n] ?? plain, { world: this, name: n })) : m; // a filter gets a list whole
    });
    return { text, bindings, vars: some(vars) };
  }

  /**
   * A slot's own reason for refusing a value: why="?value is not a ?key" with the
   * variables value, key, id and type (as data, as for a deny) and the same filters.
   */
  _slotWhy(s, w, key, value, v) {
    const data = (x) => (x === undefined ? undefined : x[0] === '"' ? str(x) : /^-?\d+(\.\d+)?$/.test(x) ? Number(x) : x);
    const vars = { value: data(value), key, id: w.id, type: w.type };
    const text = str(s.why).replace(SAY, (m, name, filter) => {
      if (!(name in vars) || vars[name] === undefined) return m;
      if (!filter) return String(vars[name]);
      const f = this.filters[filter];
      return f ? String(f(vars[name], { world: this, name })) : m;
    });
    return { ...v, why: text, vars, ...(v.why && v.why !== text ? { detail: v.why } : {}) };
  }

  /** A standing issue as plain data. */
  _issueOf(i) {
    return { id: i.id, rule: (i.attrs.rule || [])[0]?.slice(1), about: (i.attrs.about || []).map((v) => v.slice(1)), ...(i.attrs.key ? { key: i.attrs.key[0] } : {}), why: i.attrs.why ? str(i.attrs.why[0]) : undefined };
  }

  _validate(res) {
    const c = this._compiled();
    for (const id of res._touched) {
      const w = this.wires.get(id);
      if (!w) continue;
      this._b.tick('validate');
      for (const k of Object.keys(w.attrs)) {
        const s = c.slotOf(w.type, k);
        if (!s) {
          if (c.closed.has(w.type) && !c.isOpenKey(k)) res.violations.push({ kind: 'unknown-key', id, key: k });
        } else {
          const own = (v, x) => (s.why ? this._slotWhy(s, w, k, x, v) : v); // a reason the slot gives itself
          if (!s.many && w.attrs[k].length > 1) res.violations.push(own({ kind: 'cardinality', id, key: k }, w.attrs[k][1]));
          for (const v of w.attrs[k]) {
            if (s.min || s.max) {
              const q = quantity(v);
              const bad = !q ? 'must be a number' : s.min && q.n < s.min.n ? `must be at least ${s.min.n}` : s.max && q.n > s.max.n ? `must be at most ${s.max.n}` : null;
              if (s.soft) this._issue(w, k, bad, s, res);
              else if (bad) res.violations.push(own({ kind: 'domain', id, key: k, value: v, why: bad }, v));
            }
            if (s.enum && !s.enum.includes(v) && !s.enum.some((e) => this._same(w.type, k, e, v))) res.violations.push(own({ kind: 'domain', id, key: k, value: v, allowed: s.enum }, v));
            if (s.type && !s.kinds.length) {
              const target = v[0] === '$' ? this.wires.get(v.slice(1)) : null;
              const types = s.refs.length ? s.refs : [s.type];
              if (!target || !types.some((t) => c.isA(target.type, t))) {
                res.violations.push(own({ kind: 'domain', id, key: k, value: v, why: `must refer to a ${types.join(' or ')} wire` }, v));
              }
            } else if (s.kinds.length) {
              const target = v[0] === '$' ? this.wires.get(v.slice(1)) : null;
              const fits = s.kinds.some((kind) => fitsKind(kind, v)) || (target && s.refs.some((t) => c.isA(target.type, t)));
              if (!fits) res.violations.push(own({ kind: 'domain', id, key: k, value: v, why: `must be ${[...s.kinds, ...s.refs.map((t) => `a ${t} wire`)].join(' or ')}` }, v));
            }
          }
        }
        // unique=true: no other wire of the slot's type has this value (in its namespace)
        if (s?.unique) {
          for (const v of w.attrs[k]) {
            const other = this._sharing(w, s.of, [k], [v]);
            if (other) res.violations.push(s.why ? this._slotWhy(s, w, k, v, { kind: 'unique', id, key: k, value: v, with: other }) : { kind: 'unique', id, key: k, value: v, with: other, why: `${other} has the same ${k}` });
          }
        }
        // bookkeeping keys of an open namespace may point outside the world (a source, a pattern)
        if (!s && c.isOpenKey(k)) continue;
        for (const v of w.attrs[k]) {
          if (v[0] === '$' && !this.wires.has(v.slice(1)) && !this.matrix.has(v.slice(1))) {
            const d = { kind: 'dangling-ref', id, key: k, value: v };
            res.violations.push(s?.why ? this._slotWhy(s, w, k, v, d) : d);
          }
        }
      }
    }
    // unique=a unique=b on a type: no two wires share these values together
    if (c.uniqueSets.size) {
      for (const id of res._touched) {
        const w = this.wires.get(id);
        if (!w) continue;
        for (const t of c.lineage(w.type)) for (const keys of c.uniqueSets.get(t) || []) {
          if (!keys.every((k) => w.attrs[k])) continue;
          const other = this._sharing(w, t, keys, keys.map((k) => w.attrs[k][0]));
          if (other) res.violations.push({ kind: 'unique', id, keys, with: other, why: `${other} has the same ${keys.join(' and ')}` });
        }
      }
    }
    // A deny without negation can only start to match through a wire that was added or
    // changed, so it is checked from the touched wires. Denies with negation are checked in full.
    const reported = new Set();
    // One match per deny is enough to refuse a change. A check of the whole world, or of
    // a changed matrix, lists every match (once per set of wires).
    const every = !!res._all, seen = new Set();
    const report = (d, s) => {
      const wires = d.when.map((p) => walk('?' + p.id, s));
      if (every) {
        const name = `${d.id}\u0001${[...wires].sort().join('\u0001')}`;
        if (seen.has(name)) return;
        seen.add(name);
      } else reported.add(d);
      const said = this._say(d.why, d, s);
      res.violations.push({ kind: 'deny', rule: d.id, why: said.text, ...(said.bindings ? { bindings: said.bindings } : {}), ...(said.vars ? { vars: said.vars } : {}), ...(d.priority !== undefined ? { priority: d.priority } : {}), wires });
    };
    for (const id of res._touched) {
      const w = this.wires.get(id);
      if (!w) continue;
      for (const { rule: d, idx } of c.forType(c.denyByType, w.type)) {
        if (d.not.length || d.hasSelect || d.readsLazy || reported.has(d)) continue;
        seeded: for (const s0 of this._matchWire(d.when[idx], w, EMPTY)) {
          for (const s of this._bodies(d, s0, idx)) { report(d, s); if (!every) break seeded; }
        }
      }
    }
    for (const [d, seeds] of res._seeds) { // a deny over a group: the groups whose wires changed
      if (d.kind !== 'deny' || d.not.length || d.hasSelect || d.readsLazy || reported.has(d)) continue;
      groups: for (const s0 of seeds.values()) {
        for (const s of this._bodies(d, s0, -1)) { report(d, s); if (!every) break groups; }
      }
    }
    for (const d of c.denies) {
      if ((!d.not.length && !d.hasSelect) || d.readsLazy || reported.has(d)) continue;
      for (const s of this._bodies(d, EMPTY, -1)) { report(d, s); if (!every) break; }
    }
    // denies that read what lazy rules make: when something they or those rules read has
    // changed, the lazy rules run (in a transaction that is undone) and the denies look
    if (c.lazyDenies.length && (every || [...res._touched].some((id) => { const w = this.wires.get(id); return w && c.lineage(w.type).some((t) => c.lazyWatch.has(t)); }))) {
      const mark = this._begin(false);
      try {
        this._materialize();
        for (const d of c.lazyDenies) {
          if (reported.has(d)) continue;
          for (const s of this._bodies(d, EMPTY, -1)) { report(d, s); if (!every) break; }
        }
      } finally { this._rollback(mark); }
    }
  }

  /**
   * Run the lazy rules to a fixpoint, as if they were not lazy. The caller undoes it (it
   * is always inside a transaction that is rolled back): their conclusions never stay.
   */
  _materialize() {
    const c = this._compiled();
    if (!c.lazyRules.length) return;
    const res = this._result();
    for (let fired = true; fired;) { // bounded: each round fires at least one new firing, and the budget ticks
      fired = false;
      for (const rule of c.lazyRules) {
        for (const s of [...this._bodies(rule, EMPTY, -1)]) {
          this._b.tick('chase');
          if (this.firings.has(this._sig(rule, s))) continue;
          this._fire(rule, s, c, res);
          fired = true;
        }
      }
    }
  }
}

Object.assign(World.prototype, completion, revision, querying, timing, tiering, describing, interpreting);
/** The difference between two worlds (see world.diff). */
World.diff = (a, b) => a.diff(b);
