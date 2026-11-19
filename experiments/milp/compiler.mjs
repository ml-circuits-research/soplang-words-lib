// MILP experiment: glpk.js (GLPK 5.0 compiled to WASM, Node interface).
//
// Every spatial/temporal decision becomes an integer program:
//   positions, start times   -> integer variables (`generals`)
//   before/after orderings    -> binary side-choice variables + big-M rows
//   shelf assignment         -> binary y[item][shelf] + assignment/capacity rows
//   preferences (earliest, centred, near) -> minimised linear objective
// glpk.js@5.0 exposes a JSON LP interface (solve(lp)), not the raw C API; the
// JSON below encodes exactly what the glp_* C calls would set up (columns,
// rows, bounds, col kinds, objective direction, intopt).
import glpkFactory from 'glpk.js/node';
import { wires, attr, num, of, instanceOf } from '../common/lib.mjs';

const DAY = 480;
const M = 1000; // big-M: comfortably larger than page/day extents
const COLOUR = { sun: 'yellow', boat: 'brown', tree: 'green', house: 'red', circle: 'blue', lake: 'blue', rectangle: 'green' };
let GLP = null;
const lib = async () => (GLP ??= await glpkFactory());

export const compile = async (caseDef) => {
  try {
    const intent = readIntent(caseDef.intent);
    const objects = instanceOf(caseDef.world);
    if (intent.act === 'change') return changeOne(intent, objects);
    if (caseDef.family === 'draw') return makeDraw(intent, objects);
    if (caseDef.family === 'cal') return makeCal(intent, objects);
    if (caseDef.family === 'store') return assignStore(intent, objects);
    return { ok: false, reason: 'unknown-family' };
  } catch (e) {
    return { ok: false, reason: 'error: ' + String(e.message).split('\n')[0] };
  }
};

const sop = (lines) => ({ ok: true, sop: lines.join('\n') + '\n' });
const refuse = (reason, detail) => ({ ok: false, reason: 'no-solution: ' + reason + (detail ? ' (' + detail + ')' : '') });

const readIntent = (text) => {
  const ws = wires(text);
  const option = (k) => of(ws, 'x.option').find((o) => attr(o, 'key') === k);
  return {
    act: attr(of(ws, 'x.intent')[0], 'act'),
    note: attr(of(ws, 'x.intent')[0], 'note'),
    targets: of(ws, 'x.target'),
    rels: of(ws, 'x.rel'),
    option,
  };
};

const facts = (objects, type) => [...objects.values()].filter((t) => t.type === type);
const rectOf = (t) => ({ x: num(t, 'x'), y: num(t, 'y'), w: num(t, 'w'), h: num(t, 'h') });
const byName = (objects, id) => objects.get(id) || [...objects.values()].find((t) => t.attrs.name?.[0] === id);

// ---- tiny JSON-LP model ----------------------------------------------------
// Rows are sum(coef*var) (op) rhs; bnds types/obj direction come from GLPK.
class Model {
  constructor() {
    this.objective = { direction: GLP.GLP_MIN, name: 'obj', vars: [] };
    this.subjectTo = [];
    this.bounds = [];
    this.binaries = [];
    this.generals = [];
    this.rows = 0;
  }
  int(name, lb, ub) { this.generals.push(name); this.bounds.push({ name, type: GLP.GLP_DB, lb, ub }); return name; }
  bin(name) { this.binaries.push(name); this.bounds.push({ name, type: GLP.GLP_DB, lb: 0, ub: 1 }); return name; }
  cost(name, coef) { this.objective.vars.push({ name, coef }); }
  row(terms, type, lb, ub) {
    this.subjectTo.push({ name: 'r' + this.rows++, vars: terms.filter(([, c]) => c !== 0).map(([n, c]) => ({ name: n, coef: c })), bnds: { type, lb, ub } });
  }
  leq(terms, rhs) { this.row(terms, GLP.GLP_UP, 0, rhs); }
  geq(terms, rhs) { this.row(terms, GLP.GLP_LO, rhs, 0); }
  eq(terms, rhs) { this.row(terms, GLP.GLP_FX, rhs, rhs); }
  async solve() {
    const G = await lib();
    const r = G.solve({ name: 'mip', objective: this.objective, subjectTo: this.subjectTo, bounds: this.bounds, binaries: this.binaries, generals: this.generals, options: { msglev: G.GLP_MSG_OFF } });
    return r.result.status === G.GLP_OPT ? r.result.vars : null;
  }
}

// ---- one state change: recolour an existing object (selection, no MILP) ----
function changeOne(intent, objects) {
  const t = intent.targets[0];
  const value = intent.option('colour') && attr(intent.option('colour'), 'value');
  const cands = facts(objects, 'draw.thing').filter((o) =>
    (!attr(t, 'kind') || attr(o, 'kind') === attr(t, 'kind')) &&
    (!attr(t, 'colour') || attr(o, 'colour') === attr(t, 'colour')));
  if (!value || !cands.length) return refuse('change: nothing matches', attr(t, 'kind'));
  return sop([`@n1 x.set object=${cands[0].id} key=colour value=${value}`]);
}

// ---- drawing ---------------------------------------------------------------
// Rects under solver control: {xv, yv, w, h}; fixed rects: {x, y, w, h, id}.
// For axis expressions: terms(const r, axis) gives the linear part and
// konst(r, axis) the constant, so both kinds enter rows uniformly.
const terms = (r, axis) => (r.xv ? [[axis === 'x' ? r.xv : r.yv, 1]] : []);
const konst = (r, axis) => (r.xv ? 0 : r[axis]);

// "b is before a along axis, with a visible gap >= 1": xb + wb + 1 <= xa.
// Relaxed with big-M unless binary `b` is 1.
function before(model, b, bRect, aRect, axis, wb) {
  model.leq([...terms(bRect, axis), ...terms(aRect, axis).map(([n, c]) => [n, -c]), [b, M]],
    konst(aRect, axis) - konst(bRect, axis) - wb - 1 + M);
}

// pairwise disjointness: 4 binaries (left/right/above/below), at least one active
function disjoint(model, p, q) {
  const b = [0, 1, 2, 3].map((k) => model.bin(`d${model.binaries.length}_${k}`));
  model.geq(b.map((v) => [v, 1]), 1);
  before(model, b[0], p, q, 'x', p.w); // p left of q
  before(model, b[1], q, p, 'x', q.w); // p right of q
  before(model, b[2], p, q, 'y', p.h); // p above q
  before(model, b[3], q, p, 'y', q.h); // p below q
}

// minimise |2x + w - 2tx| + |2y + h - 2ty|: pull the object centre to (tx, ty)
function centrePull(model, r, tx, ty) {
  const u = model.int('u' + model.generals.length, 0, M), v = model.int('v' + model.generals.length, 0, M);
  model.geq([[u, 1], [r.xv, 2]], 2 * tx - r.w);
  model.geq([[u, 1], [r.xv, -2]], r.w - 2 * tx);
  model.geq([[v, 1], [r.yv, 2]], 2 * ty - r.h);
  model.geq([[v, 1], [r.yv, -2]], r.h - 2 * ty);
  model.cost(u, 1); model.cost(v, 1);
}

// 'near': exactly one of the four sides is chosen (binaries, sum = 1); the
// separation along the chosen side is trapped in [gmin, gap], the others are
// relaxed by big-M. 8 rows per (target, anchor) pair.
function nearSide(model, r, a, gmin, gap) {
  const X = r.xv, Y = r.yv, w = r.w, h = r.h;
  const bs = [0, 1, 2, 3].map((k) => model.bin(`s${X.slice(2)}_${k}`));
  model.eq(bs.map((b) => [b, 1]), 1);
  const [L, R, A, B] = bs;
  model.leq([[X, -1], [L, M]], gap + M - a.x + w); // a.x - X - w <= gap + M(1-L)
  model.leq([[X, 1], [L, M]], a.x - w - gmin + M); // ... >= gmin - M(1-L)
  model.leq([[X, 1], [R, M]], a.x + a.w + gap + M); // X - a.x - a.w <= gap + M(1-R)
  model.leq([[X, -1], [R, M]], M - a.x - a.w - gmin); // ... >= gmin - M(1-R)
  model.leq([[Y, -1], [A, M]], gap + M - a.y + h);
  model.leq([[Y, 1], [A, M]], a.y - h - gmin + M);
  model.leq([[Y, 1], [B, M]], a.y + a.h + gap + M);
  model.leq([[Y, -1], [B, M]], M - a.y - a.h - gmin);
}

async function makeDraw(intent, objects) {
  await lib();
  const model = new Model();
  const existing = facts(objects, 'draw.thing').map((t) => ({ id: t.id, ...rectOf(t) }));
  const news = []; // solver rects, in output order
  for (const t of intent.targets.filter((x) => attr(x, 'mode') === 'new')) {
    const kind = attr(t, 'kind'), w = num(t, 'w') || 40, h = num(t, 'h') || 40;
    const count = num(t, 'count') || 1;
    const rel = intent.rels.find((r) => attr(r, 'target') === '$' + t.id);
    const anchor = rel ? byName(objects, attr(rel, 'anchor')) : null;
    for (let c = 0; c < count; c++) {
      const i = news.length;
      const rect = { kind, xv: model.int(`x_${i}`, 0, 800 - w), yv: model.int(`y_${i}`, 0, 600 - h), w, h };
      news.push(rect);
      if (!rel) {
        centrePull(model, rect, 400, 300); // no relation: cluster at the page centre
      } else if (anchor) {
        const a = rectOf(anchor);
        const relKind = attr(rel, 'kind'), gap = num(rel, 'gap') ?? 40;
        if (relKind === 'on' || relKind === 'in') { // fully inside the anchor
          model.geq(terms(rect, 'x'), a.x); model.geq(terms(rect, 'y'), a.y);
          model.leq(terms(rect, 'x'), a.x + a.w - w); model.leq(terms(rect, 'y'), a.y + a.h - h);
          centrePull(model, rect, a.x + a.w / 2, a.y + a.h / 2);
          rect.insideAnchor = anchor.id; // the anchor is not an obstacle
        } else if (relKind === 'near') {
          centrePull(model, rect, a.x + a.w / 2, a.y + a.h / 2);
          nearSide(model, rect, a, Math.max(1, Math.round(gap / 2)), gap);
        } else return refuse('draw: unsupported relation', relKind);
      } else return refuse('draw: unknown anchor', attr(rel, 'anchor'));
      // disjoint from every other object (pre-existing or new), except an on/in anchor
      for (const o of [...existing, ...news.slice(0, i)])
        if (!(rect.insideAnchor && o.id === rect.insideAnchor)) disjoint(model, rect, o);
    }
  }
  if (!news.length) return refuse('draw: nothing to make');
  const z = await model.solve();
  if (!z) return refuse('draw: infeasible placement');
  const lines = news.map((r, i) =>
    `@n${i + 1} draw.thing kind=${r.kind} x=${Math.round(z[r.xv])} y=${Math.round(z[r.yv])} w=${r.w} h=${r.h} colour=${COLOUR[r.kind] || 'green'}`);
  return sop(lines);
}

// ---- calendar: start times as integers, orderings as binaries ---------------
async function makeCal(intent, objects) {
  await lib();
  const person = intent.option('person') ? attr(intent.option('person'), 'value') : 'Ana';
  const busy = facts(objects, 'cal.event').filter((e) => attr(e, 'person') === person)
    .map((e) => ({ s: num(e, 'start'), e: num(e, 'end') }));
  const minStart = intent.option('start-min') ? Number(attr(intent.option('start-min'), 'value')) : 0;
  const model = new Model();
  const meetings = [];
  for (const t of intent.targets) {
    const dur = num(t, 'w') || 30, count = num(t, 'count') || 1;
    for (let c = 0; c < count; c++) {
      const s = model.int(`s_${meetings.length}`, minStart, DAY - dur);
      model.cost(s, 1); // earliest = the minimised objective
      meetings.push({ s, dur });
    }
  }
  if (!meetings.length) return refuse('cal: nothing to schedule');
  for (const [i, m] of meetings.entries()) {
    for (const b of busy) { // m after b OR before b: one binary, big-M relaxed
      const z = model.bin(`bz_${i}`);
      model.leq([[m.s, -1], [z, M]], M - b.e); // z=1 -> s >= b.e
      model.leq([[m.s, 1], [z, -M]], b.s - m.dur); // z=0 -> s + dur <= b.s
    }
    for (let j = i + 1; j < meetings.length; j++) { // two new meetings: order one way or the other
      const o = meetings[j], z = model.bin(`oz_${i}_${j}`);
      model.leq([[m.s, -1], [o.s, 1], [z, M]], M - o.dur); // z=1 -> m after o
      model.leq([[m.s, 1], [o.s, -1], [z, -M]], -m.dur); // z=0 -> m before o
    }
  }
  const z = await model.solve();
  if (!z) return refuse('schedule', 'person=' + person);
  return sop(meetings.map((m, i) =>
    `@n${i + 1} cal.event title="meeting" start=${Math.round(z[m.s])} end=${Math.round(z[m.s]) + m.dur} person=${person}`));
}

// ---- storage: a textbook assignment MILP ------------------------------------
async function assignStore(intent, objects) {
  await lib();
  const shelves = facts(objects, 'store.shelf').map((t) => ({ name: attr(t, 'name'), cap: num(t, 'capacity') }));
  const items = facts(objects, 'store.item').map((t) => ({ name: attr(t, 'name'), size: num(t, 'size') }));
  const pair = intent.option('with-pair') ? attr(intent.option('with-pair'), 'value').split(',') : null;
  const model = new Model();
  const y = new Map(); // item name -> [binary per shelf]
  items.forEach((it, i) => {
    y.set(it.name, shelves.map((s, j) => {
      const v = model.bin(`y_${i}_${j}`);
      model.cost(v, j + 1); // cosmetic tie-break: lower-indexed shelves first
      return v;
    }));
    model.eq(y.get(it.name).map((v) => [v, 1]), 1); // each item on exactly one shelf
  });
  shelves.forEach((s, j) => model.leq(items.map((it) => [y.get(it.name)[j], it.size]), s.cap)); // capacity
  if (pair && pair.every((nm) => y.has(nm))) // two named items share a shelf
    shelves.forEach((s, j) => {
      const [a, b] = pair.map((nm) => y.get(nm)[j]);
      model.leq([[a, 1], [b, -1]], 0);
      model.leq([[a, -1], [b, 1]], 0);
    });
  const z = await model.solve();
  if (!z) return refuse('capacity', items.map((i) => i.size).join(','));
  return sop(items.map((it, i) => {
    const j = y.get(it.name).findIndex((v) => z[v] > 0.5);
    return `@n${i + 1} store.put item=${it.name} shelf=${shelves[j].name}`;
  }));
}
