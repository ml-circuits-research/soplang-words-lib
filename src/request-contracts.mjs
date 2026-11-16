import { str } from './parser.mjs';
import { fitsKind } from './matrix.mjs';

const OPERATORS = {
  eq: ['value'], 'less.equal': ['value'], 'greater.equal': ['value'], degree: ['value'], region: ['value'],
  relation: ['relation', 'goal'], same: ['value'], occurred: ['act', 'phase', 'value'],
  delta: ['value', 'unit', 'baseline', 'anchor'], factor: ['value', 'baseline', 'anchor'],
};
const VARIANT_KEYS = ['value', 'relation', 'goal', 'act', 'phase', 'unit', 'baseline', 'anchor', 'measure', 'from', 'to'];
const first = (w, k) => w?.attrs[k]?.[0];
const unref = (v) => typeof v === 'string' && v.startsWith('$') ? v.slice(1) : null;

/** Structural request inspection only: no vocabulary resolution, truth or effects. */
export function inspectRequest(world, id, options = {}) {
  return world._guard(options, () => inspect(world, id, options.family || 'std.request'),
    budget => ({ ok: false, issues: [budget] }));
}
function inspect(world, id, family) {
  const issues = [], tick = () => world._b.tick('validate');
  const fail = (wire, why) => issues.push({ kind: 'request-graph', id: wire?.id || String(id), why });
  const get = v => { const key = unref(v); return key === null ? null : world.get(key); };
  const request = world.get(String(id).replace(/^\$/, ''));
  const c = world._compiled();
  if (!request || !c.isA(request.type, family)) return { ok: false, issues: [{ kind: 'request-graph', id: String(id), why: 'not a request in the declared family' }] };
  if (!c.validators.some(d => d.on === family && d.fn === family + '.valid')) return { ok: false, issues: [{ kind: 'request-graph', id: request.id, why: 'request contract module is not loaded' }] };
  const owned = w => get(first(w, 'request'))?.id === request.id;
  const targets = new Map(), values = new Map(), nodes = new Map(), kinds = new Map();
  for (const w of world.ofType(family + '.target')) { tick(); if (owned(w)) targets.set(w.id, w); }
  for (const kind of ['constraint', 'not', 'group', 'quant']) for (const w of world.ofType(family + '.' + kind)) {
    tick(); if (owned(w)) { nodes.set(w.id, w); kinds.set(w.id, kind); }
  }
  for (const w of world.ofType(family + '.value')) {
    tick(); const target = get(first(w, 'target'));
    if (target && targets.has(target.id)) values.set(w.id, w);
  }
  const targetOf = (w, key) => {
    const target = get(first(w, key));
    if (!target || !targets.has(target.id)) { fail(w, `${key} must belong to this request`); return null; }
    return target;
  };
  const sourceCache = new Map();
  const sourceText = source => {
    if (!source || !c.isA(source.type, family + '.source') || first(source, 'text') === undefined) return null;
    if (sourceCache.has(source.id)) return sourceCache.get(source.id);
    const text = str(first(source, 'text')), chars = [];
    for (const ch of text) { tick(); const cp = ch.codePointAt(0); if (cp >= 0xd800 && cp <= 0xdfff) return null; chars.push(ch); }
    sourceCache.set(source.id, chars);
    return chars;
  };
  if (sourceText(get(first(request, 'source'))) === null) fail(request, 'source must contain valid Unicode text');
  for (const target of targets.values()) {
    tick(); const mode = first(target, 'mode');
    if (mode !== 'bound' && !first(target, 'kind')) fail(target, 'new/existing targets require kind');
    if (mode === 'bound' && (target.attrs.name || target.attrs.determiner)) fail(target, 'bound targets cannot independently name or select a referent');
  }
  const edges = new Map(), binders = new Map(), uses = new Map();
  for (const [key, node] of nodes) {
    tick(); const kind = kinds.get(key), childRefs = [], nodeUses = [];
    const use = field => { const t = targetOf(node, field); if (t) nodeUses.push(t.id); return t; };
    if (kind === 'not') childRefs.push(first(node, 'of'));
    else if (kind === 'group') childRefs.push(...(node.attrs.member || []));
    else if (kind === 'quant') {
      const collection = use('target'), bound = targetOf(node, 'bind');
      if (bound) {
        if (first(bound, 'mode') !== 'bound' || collection?.id === bound.id) fail(node, 'quantifier requires a distinct bound target');
        if (binders.has(bound.id)) fail(node, 'a bound target has more than one binder');
        binders.set(bound.id, node.id);
      }
      childRefs.push(first(node, 'body'));
    } else {
      use('target');
      const op = first(node, 'operator'), required = OPERATORS[op];
      if (!required) fail(node, 'unknown operator');
      else {
        const allowed = new Set(required);
        if (op === 'eq' || op === 'less.equal' || op === 'greater.equal') allowed.add('unit');
        if (op === 'relation') for (const k of ['measure', 'unit', 'from', 'to']) allowed.add(k);
        for (const k of required) if (first(node, k) === undefined) fail(node, `${op} requires ${k}`);
        for (const k of VARIANT_KEYS) if (node.attrs[k] && !allowed.has(k)) fail(node, `${op} forbids ${k}`);
        const value = first(node, 'value');
        if (op === 'relation') {
          use('goal');
          const measured = ['measure', 'unit', 'from', 'to'].filter(k => first(node, k) !== undefined);
          if (measured.length && measured.length !== 4) fail(node, 'measured relation requires measure/unit/from/to together');
        } else if (op === 'same') {
          const description = get(value);
          if (!description || !values.has(description.id)) fail(node, 'same requires a value description belonging to this request');
          else { const t = get(first(description, 'target')); if (t) nodeUses.push(t.id); }
        } else if (op === 'occurred') {
          if (!['true', 'false'].includes(value) || first(node, 'phase') !== 'result') fail(node, 'occurred requires a boolean value and result phase');
        } else if (op === 'delta' || op === 'factor') {
          if (!fitsKind('number', value || '') || (op === 'factor' && !(Number(value) > 0))) fail(node, 'change magnitude must be finite; factor must be positive');
        } else if (value?.startsWith('$')) fail(node, 'this operator requires a literal value, not a reference');
        if (['degree', 'region'].includes(op) && !fitsKind('atom', value || '')) fail(node, 'degree/region require an unquoted vocabulary name');
      }
      const start = first(node, 'source.start'), end = first(node, 'source.end');
      const source = get(first(node, 'source'));
      if (first(node, 'source') !== undefined && sourceText(source) === null) fail(node, 'invalid constraint source');
      if (start !== undefined || end !== undefined) {
        const text = sourceText(source), a = Number(start), b = Number(end);
        if (!text || !Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b <= a || b > text.length) fail(node, 'source span must be a nonempty in-range Unicode scalar interval');
      }
    }
    uses.set(key, nodeUses);
    const children = [];
    for (const ref of childRefs) {
      tick(); const child = get(ref);
      if (!child || !nodes.has(child.id)) fail(node, 'logical child must belong to this request');
      else children.push(child.id);
    }
    edges.set(key, [...new Set(children)]);
  }
  for (const t of targets.values()) if (first(t, 'mode') === 'bound' && !binders.has(t.id)) fail(t, 'bound target has no binder');
  // Selectors read candidate pre-state; the request root describes desired
  // results. A node has one context, including shared descendants of DAG roots.
  const contexts = new Map(), roots = [];
  const claim = (start, context) => {
    const pending = [start], visited = new Set();
    while (pending.length) {
      tick(); const key = pending.pop();
      if (visited.has(key)) continue;
      visited.add(key);
      if (contexts.has(key) && contexts.get(key) !== context) { fail(nodes.get(key), 'graph node belongs to more than one selection/result context'); continue; }
      contexts.set(key, context);
      for (const child of edges.get(key) || []) { tick(); pending.push(child); }
    }
  };
  for (const target of targets.values()) {
    tick(); const selectorValue = first(target, 'selector');
    if (selectorValue === undefined) continue;
    const selector = get(selectorValue);
    if (first(target, 'mode') !== 'existing') fail(target, 'only existing targets can have selectors');
    if (!selector || !nodes.has(selector.id)) fail(target, 'selector must belong to this request');
    else { roots.push(selector.id); claim(selector.id, 'selection:' + target.id); }
  }
  const rootValue = first(request, 'root'), root = get(rootValue);
  if (rootValue !== undefined) {
    if (!root || !nodes.has(root.id)) fail(request, 'root must belong to this request');
    else { roots.push(root.id); claim(root.id, 'result'); }
  } else {
    for (const [key, kind] of kinds) {
      tick(); if (contexts.has(key)) continue;
      if (kind !== 'constraint') fail(nodes.get(key), 'result logical nodes require an explicit request root');
      else { roots.push(key); claim(key, 'result'); }
    }
  }
  for (const [key, node] of nodes) {
    tick(); const context = contexts.get(key);
    if (!context) fail(node, 'node is unreachable from result or selector roots');
    else if (context !== 'result' && kinds.get(key) === 'constraint' && ['delta', 'factor', 'occurred'].includes(first(node, 'operator'))) fail(node, 'selector cannot assert a requested change or event result');
  }
  if (issues.length) return { ok: false, issues };
  // Kahn order checks all owned nodes, including disconnected cycles.
  const indegree = new Map([...nodes.keys()].map(k => [k, 0]));
  for (const children of edges.values()) for (const child of children) { tick(); indegree.set(child, indegree.get(child) + 1); }
  const queue = [...indegree].filter(([,n]) => n === 0).map(([k]) => k), order = [];
  for (let i = 0; i < queue.length; i++) {
    tick(); const key = queue[i]; order.push(key);
    for (const child of edges.get(key)) { tick(); indegree.set(child, indegree.get(child) - 1); if (!indegree.get(child)) queue.push(child); }
  }
  if (order.length !== nodes.size) { fail(request, 'logical graph contains a cycle'); return { ok: false, issues }; }
  // Intersect incoming lexical scopes: every path must carry a binding, not
  // merely the first path that reaches a shared DAG node.
  const scopes = new Map();
  const copyScope = scope => { const copy = new Set(); for (const binding of scope) { tick(); copy.add(binding); } return copy; };
  for (const key of roots) { tick(); scopes.set(key, new Set()); }
  for (const key of order) {
    tick(); const scope = scopes.get(key), node = nodes.get(key);
    if (!scope) { fail(node, 'node is unreachable from the request root'); continue; }
    for (const used of uses.get(key)) { tick(); if (first(targets.get(used), 'mode') === 'bound' && !scope.has(used)) fail(node, 'bound target used outside its binder body'); }
    const outgoing = copyScope(scope);
    if (kinds.get(key) === 'quant') outgoing.add(get(first(node, 'bind')).id);
    for (const child of edges.get(key)) {
      tick(); const previous = scopes.get(child);
      if (!previous) scopes.set(child, copyScope(outgoing));
      else for (const binding of previous) { tick(); if (!outgoing.has(binding)) previous.delete(binding); }
    }
  }
  return { ok: issues.length === 0, issues };
}

export const requestValidator = ([ref], world, context) => inspectRequest(world, ref, { family: context.type }).ok;
