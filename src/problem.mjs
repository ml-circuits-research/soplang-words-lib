// The search step of the compiler (book 6.8.2, `search`): one problem made of typed variables with declared
// domains, named boxes and intervals built from variables or numbers, hard constraints and weighted soft
// terms, a declared budget and a depth. A provider solves it: the bounded internal search here (no
// dependency, runs in browsers), or an external one such as the Z3 provider in node/smt-z3.mjs. Every
// provider answers in the same SOP shape and distinguishes a proved impossibility from an exhausted budget.
import { parse, serialize } from './parser.mjs';

const prefix = 'std.problem.';
const schema = {
  request: { budget: 'kind=integer min=1', depth: 'kind=atom enum=quick enum=alternatives', count: 'kind=integer min=1 max=16',
    var: 'type=std.problem.var many=true', box: 'type=std.problem.box many=true', span: 'type=std.problem.span many=true',
    constraint: 'type=std.problem.constraint many=true' },
  var: { name: 'kind=atom present=true', min: 'kind=number present=true', max: 'kind=number present=true', step: 'kind=number' },
  box: { name: 'kind=atom present=true', x: 'kind=any present=true', y: 'kind=any present=true', w: 'kind=any present=true', h: 'kind=any present=true' },
  span: { name: 'kind=atom present=true', start: 'kind=any present=true', length: 'kind=any present=true' },
  constraint: { name: 'kind=atom present=true', predicate: 'kind=atom present=true', a: 'kind=atom', b: 'kind=atom', gap: 'kind=number',
    value: 'kind=any', strength: 'kind=atom enum=hard enum=soft', weight: 'kind=number' },
  result: { status: 'kind=atom enum=solved enum=unsatisfiable enum=exhausted enum=budget enum=invalid present=true', provider: 'kind=atom',
    reason: 'kind=atom', cost: 'kind=number', assignment: 'type=std.problem.assignment many=true', conflict: 'kind=atom many=true',
    alternative: 'type=std.problem.alternative many=true', explored: 'kind=integer' },
  assignment: { var: 'kind=atom present=true', value: 'kind=number present=true' },
  alternative: { rank: 'kind=integer present=true', cost: 'kind=number', assignment: 'type=std.problem.assignment many=true' },
};
export const problemContract = { text: [
  '@problem.module core.module name=std.problem ' + Object.keys(schema).map(kind => 'exports=' + prefix + kind).join(' '),
  ...Object.entries(schema).flatMap(([kind, keys]) => {
    const type = prefix + kind;
    return ['@' + type + '.type core.type of=' + type + ' closed=true',
      ...Object.entries(keys).map(([key, spec]) => '@' + type + '.' + key + ' core.slot of=' + type + ' key=' + key + ' ' + spec)];
  }),
].join('\n'), fns: {} };

/**
 * The predicates every provider implements, over boxes {x,y,w,h} and spans {start,length}; a and b name a box
 * or a span, `gap` is a distance bound, `value` a number. Each is described by the hard formula a provider
 * must hold; `violation` measures how far an assignment is from it (0 when it holds), for soft terms.
 */
export const PREDICATES = {
  inside: { args: 'box box', about: 'a lies within b' },
  near: { args: 'box box', about: 'a and b do not overlap and the gap between them on each axis is at most gap' },
  apart: { args: 'box box', about: 'a and b do not overlap (a gap of at least gap, default 0)' },
  left: { args: 'box box', about: 'a ends left of b starts, by at most gap when gap is given' },
  right: { args: 'box box', about: 'a starts right of b ends, by at most gap when gap is given' },
  above: { args: 'box box', about: 'a ends above b starts, by at most gap when gap is given' },
  below: { args: 'box box', about: 'a starts below b ends, by at most gap when gap is given' },
  disjoint: { args: 'span span', about: 'the half-open spans a and b do not overlap' },
  within: { args: 'span span', about: 'span a lies within span b' },
  le: { args: 'var number', about: 'variable a is at most value' },
  ge: { args: 'var number', about: 'variable a is at least value' },
  eq: { args: 'var number', about: 'variable a equals value' },
  minimise: { args: 'var', about: 'soft only: the cost is the value of a' },
  maximise: { args: 'var', about: 'soft only: the cost is minus the value of a' },
};

const field = (row, key) => row.attrs[key]?.[0];
const num = (token) => typeof token === 'string' && /^-?\d+(\.\d+)?$/.test(token) ? Number(token) : undefined;
const ref = (token) => typeof token === 'string' && token.startsWith('$') ? token.slice(1) : undefined;
const atom = (token) => typeof token === 'string' && /^[A-Za-z_][\w.-]*$/.test(token);
const wire = (id, type, attributes) => ({ id, type: prefix + type, attrs: Object.fromEntries(Object.entries(attributes)
  .filter(([, value]) => value !== undefined && !(Array.isArray(value) && !value.length)).map(([key, value]) => [key, [].concat(value)])) });
const LIMITS = { vars: 64, boxes: 256, spans: 512, constraints: 4096, budget: 60_000, values: 2_000_000 };

/** Read and check a problem packet: a provider-neutral model or a reason it is invalid. */
export function readProblem(wires) {
  const byId = new Map(wires.map(row => [row.id, row])), requests = wires.filter(row => row.type === prefix + 'request');
  if (requests.length !== 1 || byId.size !== wires.length) return { invalid: 'problem-identity' };
  const [request] = requests, used = new Set([request.id]);
  const take = (token, kind) => { const row = byId.get(ref(token)); if (!row || row.type !== prefix + kind || used.has(row.id)) return null; used.add(row.id); return row; };
  const model = { vars: new Map(), boxes: new Map(), spans: new Map(), hard: [], soft: [],
    budget: Math.min(LIMITS.budget, num(field(request, 'budget')) ?? 2000), depth: field(request, 'depth') ?? 'quick', count: num(field(request, 'count')) ?? 3 };
  for (const token of request.attrs.var ?? []) {
    const row = take(token, 'var'); if (!row) return { invalid: 'invalid-var' };
    const name = field(row, 'name'), min = num(field(row, 'min')), max = num(field(row, 'max')), step = num(field(row, 'step'));
    if (!atom(name) || model.vars.has(name) || min === undefined || max === undefined || max < min || (step !== undefined && step <= 0)) return { invalid: 'invalid-var' };
    model.vars.set(name, { name, min, max, step });
  }
  const term = (token) => num(token) !== undefined ? { n: num(token) } : model.vars.has(token) ? { v: token } : null;
  for (const [kind, keys] of [['box', ['x', 'y', 'w', 'h']], ['span', ['start', 'length']]]) for (const token of request.attrs[kind] ?? []) {
    const row = take(token, kind); if (!row) return { invalid: 'invalid-' + kind };
    const name = field(row, 'name'), shape = { name };
    for (const key of keys) { const t = term(field(row, key)); if (!t) return { invalid: 'invalid-' + kind + '-term' }; shape[key] = t; }
    const store = kind === 'box' ? model.boxes : model.spans;
    if (!atom(name) || model.boxes.has(name) || model.spans.has(name)) return { invalid: 'invalid-' + kind };
    store.set(name, shape);
  }
  for (const token of request.attrs.constraint ?? []) {
    const row = take(token, 'constraint'); if (!row) return { invalid: 'invalid-constraint' };
    const c = { name: field(row, 'name'), predicate: field(row, 'predicate'), a: field(row, 'a'), b: field(row, 'b'),
      gap: num(field(row, 'gap')), value: num(field(row, 'value')), weight: num(field(row, 'weight')) ?? 1, strength: field(row, 'strength') ?? 'hard' };
    const spec = PREDICATES[c.predicate];
    if (!atom(c.name) || !spec) return { invalid: 'invalid-constraint' };
    const kinds = spec.args.split(' ');
    if (kinds[0] === 'box' && (!model.boxes.has(c.a) || !model.boxes.has(c.b))) return { invalid: 'invalid-constraint-box' };
    if (kinds[0] === 'span' && (!model.spans.has(c.a) || !model.spans.has(c.b))) return { invalid: 'invalid-constraint-span' };
    if (kinds[0] === 'var' && (!model.vars.has(c.a) || (kinds[1] === 'number' && c.value === undefined))) return { invalid: 'invalid-constraint-var' };
    if (['minimise', 'maximise'].includes(c.predicate) && c.strength !== 'soft') return { invalid: 'objective-must-be-soft' };
    (c.strength === 'soft' ? model.soft : model.hard).push(c);
  }
  if (used.size !== wires.length) return { invalid: 'unowned-problem-wire' };
  if (model.vars.size > LIMITS.vars || model.boxes.size > LIMITS.boxes || model.spans.size > LIMITS.spans || model.hard.length + model.soft.length > LIMITS.constraints) return { invalid: 'problem-budget' };
  return { model };
}

// Evaluation of an assignment: shared by the internal provider and by any provider's read-back check.
const val = (t, a) => t.n ?? a[t.v];
const boxOf = (model, name, a) => { const b = model.boxes.get(name); return { x: val(b.x, a), y: val(b.y, a), w: val(b.w, a), h: val(b.h, a) }; };
const spanOf = (model, name, a) => { const s = model.spans.get(name); return { s: val(s.start, a), l: val(s.length, a) }; };
const axisGap = (a0, a1, b0, b1) => (a1 <= b0 ? b0 - a1 : b1 <= a0 ? a0 - b1 : 0);
const overlaps = (p, q) => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;

/** How far an assignment is from a constraint: 0 when it holds. */
export function violation(model, c, a) {
  const pos = (n) => Math.max(0, n);
  if (['disjoint', 'within'].includes(c.predicate)) {
    const p = spanOf(model, c.a, a), q = spanOf(model, c.b, a);
    return c.predicate === 'disjoint' ? pos(Math.min(p.s + p.l, q.s + q.l) - Math.max(p.s, q.s)) : pos(q.s - p.s) + pos(p.s + p.l - (q.s + q.l));
  }
  if (['le', 'ge', 'eq', 'minimise', 'maximise'].includes(c.predicate)) {
    const v = a[c.a];
    return { le: pos(v - c.value), ge: pos(c.value - v), eq: Math.abs(v - c.value), minimise: v, maximise: -v }[c.predicate];
  }
  const p = boxOf(model, c.a, a), q = boxOf(model, c.b, a), gap = c.gap;
  const overlapArea = pos(Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)) * pos(Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y));
  const beyond = (d) => (gap === undefined ? 0 : pos(d - gap));
  switch (c.predicate) {
    case 'inside': return pos(q.x - p.x) + pos(q.y - p.y) + pos(p.x + p.w - (q.x + q.w)) + pos(p.y + p.h - (q.y + q.h));
    case 'apart': { const g = gap ?? 0, gx = axisGap(p.x, p.x + p.w, q.x, q.x + q.w), gy = axisGap(p.y, p.y + p.h, q.y, q.y + q.h); return overlapArea + (Math.max(gx, gy) >= g ? 0 : g - Math.max(gx, gy)); }
    case 'near': return overlapArea + pos(axisGap(p.x, p.x + p.w, q.x, q.x + q.w) - (gap ?? 0)) + pos(axisGap(p.y, p.y + p.h, q.y, q.y + q.h) - (gap ?? 0));
    case 'left': return pos(p.x + p.w - q.x) + beyond(q.x - (p.x + p.w));
    case 'right': return pos(q.x + q.w - p.x) + beyond(p.x - (q.x + q.w));
    case 'above': return pos(p.y + p.h - q.y) + beyond(q.y - (p.y + p.h));
    case 'below': return pos(q.y + q.h - p.y) + beyond(p.y - (q.y + q.h));
    default: return Infinity;
  }
}
export const holds = (model, c, a) => violation(model, c, a) === 0;
export const costOf = (model, a) => model.soft.reduce((sum, c) => sum + c.weight * violation(model, c, a), 0);

/** The bounded internal provider: enumeration over each variable's grid, best soft cost first. */
export function solveInternal(model, { now = () => Date.now() } = {}) {
  const names = [...model.vars.keys()], start = now();
  const grid = names.map((name) => {
    const v = model.vars.get(name), width = v.max - v.min, step = v.step ?? Math.max(1, width / 24);
    const values = []; for (let x = v.min; x <= v.max + 1e-9 && values.length < 4096; x += step) values.push(+x.toFixed(6));
    if (values.at(-1) !== v.max) values.push(v.max);
    return values;
  });
  const total = grid.reduce((p, g) => p * g.length, 1);
  if (total > LIMITS.values) return { status: 'budget', reason: 'domain-too-large', explored: 0 };
  const found = [], a = {};
  let explored = 0, timedOut = false;
  // Constraints are checked as soon as every variable they read is assigned.
  const readsOf = (c) => {
    const terms = [];
    if (model.boxes.has(c.a)) terms.push(...Object.values(model.boxes.get(c.a)).filter((t) => t?.v)); if (model.boxes.has(c.b)) terms.push(...Object.values(model.boxes.get(c.b)).filter((t) => t?.v));
    if (model.spans.has(c.a)) terms.push(...Object.values(model.spans.get(c.a)).filter((t) => t?.v)); if (model.spans.has(c.b)) terms.push(...Object.values(model.spans.get(c.b)).filter((t) => t?.v));
    if (model.vars.has(c.a)) terms.push({ v: c.a });
    return Math.max(-1, ...terms.map((t) => names.indexOf(t.v)));
  };
  const at = names.map(() => []), ground = [];
  for (const c of model.hard) { const i = readsOf(c); (i < 0 ? ground : at[i]).push(c); }
  if (ground.some((c) => !holds(model, c, a))) return { status: 'unsatisfiable', reason: 'fixed-values', conflict: ground.filter((c) => !holds(model, c, a)).map((c) => c.name), explored: 0, provider: 'internal' };
  const keep = Math.max(1, model.depth === 'alternatives' ? model.count : 1);
  const visit = (i) => { // bounded: depth is the number of variables (at most 64) and the product of the grids is capped by LIMITS.values
    if (timedOut) return;
    if (i === names.length) { explored++; const cost = costOf(model, a); found.push({ cost, assignment: { ...a } }); found.sort((p, q) => p.cost - q.cost); if (found.length > keep) found.pop(); return; }
    for (const x of grid[i]) {
      if ((explored & 1023) === 0 && now() - start > model.budget) { timedOut = true; return; }
      a[names[i]] = x;
      if (at[i].every((c) => holds(model, c, a))) visit(i + 1);
    }
    delete a[names[i]];
  };
  visit(0);
  if (found.length) return { status: 'solved', provider: 'internal', cost: found[0].cost, assignment: found[0].assignment, alternatives: found.slice(1), explored };
  if (timedOut) return { status: 'budget', provider: 'internal', reason: 'time', explored };
  // Every grid point fails: impossibility on the grid, not a proof over the continuous domain.
  return { status: 'exhausted', provider: 'internal', reason: 'no-grid-point', explored };
}

/** Serialize a provider's answer as std.problem.result wires. */
export function problemResult(answer) {
  const rows = [], assign = (assignment, prefixId) => Object.entries(assignment ?? {}).map(([name, value], i) => {
    const row = wire(prefixId + '.' + i, 'assignment', { var: name, value: String(+(+value).toFixed(6)) }); rows.push(row); return '$' + row.id; });
  const main = assign(answer.assignment, 'problem.output.assignment');
  const alternatives = (answer.alternatives ?? []).map((alt, i) => {
    const refs = assign(alt.assignment, 'problem.output.alternative.' + i + '.assignment');
    const row = wire('problem.output.alternative.' + i, 'alternative', { rank: String(i + 2), cost: alt.cost === undefined ? undefined : String(+alt.cost.toFixed(6)), assignment: refs });
    rows.push(row); return '$' + row.id;
  });
  const result = wire('problem.output.result', 'result', { status: answer.status, provider: answer.provider, reason: answer.reason,
    cost: answer.cost === undefined ? undefined : String(+answer.cost.toFixed(6)), assignment: main, conflict: answer.conflict, alternative: alternatives,
    explored: answer.explored === undefined ? undefined : String(answer.explored) });
  return serialize([result, ...rows]);
}

/**
 * Solve a std.problem packet. `provider(model)` may be supplied (for example the Z3 provider); it returns the
 * same answer shape as solveInternal, synchronously or as a promise. Every solved assignment is read back
 * against the hard constraints before it is reported, so a provider defect cannot pass as a solution.
 */
export function solveProblem(sop, { provider } = {}) {
  let wires;
  try { wires = typeof sop === 'string' ? parse(sop) : sop; } catch { return problemResult({ status: 'invalid', reason: 'invalid-sop' }); }
  const { model, invalid } = readProblem(wires);
  if (invalid) return problemResult({ status: 'invalid', reason: invalid });
  const finish = (answer) => {
    if (answer.status === 'solved') {
      const broken = model.hard.filter((c) => !holds(model, c, answer.assignment));
      if (broken.length) return problemResult({ status: 'invalid', reason: 'provider-read-back', conflict: broken.map((c) => c.name), provider: answer.provider });
    }
    return problemResult(answer);
  };
  const answer = provider ? provider(model) : solveInternal(model);
  return answer && typeof answer.then === 'function' ? answer.then(finish) : finish(answer);
}
