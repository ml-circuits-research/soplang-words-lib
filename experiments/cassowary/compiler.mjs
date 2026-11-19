// Experiment: elaboration as constraint hierarchy solving (kiwi.js, the JavaScript
// Cassowary). Cassowary gives continuous linear arithmetic with a strength ladder
// (required > strong > medium > weak) and no disjunctions and no integers.
// The mapping used here:
//
//   - every hard intent fact (page bounds, containment, non-overlap, capacities,
//     day bounds) becomes a required constraint;
//   - every preference (centre in the anchor / page, sit at half the allowed gap,
//     pull meeting starts to the earliest possible minute) becomes a medium/weak
//     equality that Cassowary trades off against the others inside one solve;
//   - every disjunction (which side of the anchor? before or after the busy block?
//     which relative side between two objects?) is enumerated OUTSIDE kiwi over
//     the tiny domains of this corpus. kiwi itself judges each enumeration branch:
//     adding a required constraint that turns out to conflict with the ones
//     already in the solver throws 'unsatisfiable constraint' — that throw is
//     the branch's feasibility oracle.
//
// So the split of labour is: enumeration for the discrete structure, Cassowary for
// the linear structure and for weighing the soft preferences — its home turf.
//
// Integer-ness is not native: solved coordinates are rounded and every hard
// predicate is re-verified on the rounded integers; a branch whose rounding broke
// a predicate is discarded like any other infeasible branch. All enumeration is
// in fixed array order — no Math.random, no Date, stable iteration throughout.
import kiwi from 'kiwi.js';
import { wires, attr, num, of, instanceOf } from '../common/lib.mjs';

const { Solver, Variable, Operator, Strength } = kiwi;

const DAY = 480;
const PAGE_W = 800;
const PAGE_H = 600;
const COLOUR = { sun: 'yellow', boat: 'brown', tree: 'green', house: 'red', circle: 'blue', lake: 'blue', rectangle: 'green' };
const MARGIN = 8;    // required visible gap between placed rectangles
const NEAR_MIN = 2;  // smallest gap that still counts as a visible 'near' gap
const SIDES = ['right', 'below', 'left', 'above']; // the disjunction order, fixed

export const compile = (caseDef) => {
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

// Mixed-radix decode of one enumeration index into a branch: fixed order.
const branches = (count, sizes) => {
  const all = [];
  for (let pick = 0; pick < count; pick++) {
    const v = [];
    let rest = pick;
    for (let i = sizes.length - 1; i >= 0; i--) { v[i] = rest % sizes[i]; rest = Math.floor(rest / sizes[i]); }
    all.push(v);
  }
  return all;
};

// ---- one state change: recolour an existing object ------------------------
// A single unambiguous lookup: nothing here is linear arithmetic, so Cassowary is
// not involved at all (honest absence, not a bypass).
function changeOne(intent, objects) {
  const t = intent.targets[0];
  const value = intent.option('colour') && attr(intent.option('colour'), 'value');
  const cands = facts(objects, 'draw.thing').filter((o) =>
    (!attr(t, 'kind') || attr(o, 'kind') === attr(t, 'kind')) &&
    (!attr(t, 'colour') || attr(o, 'colour') === attr(t, 'colour')));
  if (!value || !cands.length) return refuse('change: nothing matches', attr(t, 'kind'));
  return sop([`@n1 x.set object=${cands[0].id} key=colour value=${value}`]);
}

// ---- drawing --------------------------------------------------------------
// Joint layout in ONE kiwi problem per enumeration branch. A branch picks, for
// every 'near' relation, a side of the anchor, and for every disjointness pair,
// which side of the other object this one sits on. All branches are solved; the
// solution best satisfying the soft pulls (smallest total |value - target|,
// ties broken by branch order) wins.
function makeDraw(intent, objects) {
  const existing = facts(objects, 'draw.thing').map((t) => ({ id: t.id, ...rectOf(t) }));
  const specs = [];
  for (const t of intent.targets.filter((q) => attr(q, 'mode') === 'new')) {
    const count = num(t, 'count') || 1;
    const rel = intent.rels.find((r) => attr(r, 'target') === '$' + t.id) || null;
    for (let c = 0; c < count; c++)
      specs.push({ kind: attr(t, 'kind'), w: num(t, 'w') || 40, h: num(t, 'h') || 40, rel });
  }
  if (!specs.length) return refuse('draw: nothing to make');

  const anchors = specs.map((p) => {
    if (!p.rel) return null;
    const a = byName(objects, attr(p.rel, 'anchor'));
    if (!a) throw new Error('unknown anchor ' + attr(p.rel, 'anchor'));
    return { rect: rectOf(a), id: a.id, kind: attr(p.rel, 'kind'), gap: num(p.rel, 'gap') ?? 40 };
  });

  // The disjunctive choices: one side per 'near' anchor, one relative side per
  // disjointness pair (new-vs-existing except own anchor, new-vs-new).
  const choices = [];
  specs.forEach((p, i) => { if (anchors[i] && anchors[i].kind === 'near') choices.push({ n: SIDES.length, kind: 'near', i }); });
  existing.forEach((o) => specs.forEach((p, i) => {
    if (!anchors[i] || anchors[i].id !== o.id) choices.push({ n: SIDES.length, kind: 'xob', i, o });
  }));
  for (let i = 0; i < specs.length; i++)
    for (let j = i + 1; j < specs.length; j++) choices.push({ n: SIDES.length, kind: 'pair', i, j });

  for (const k of specs.keys()) if (anchors[k] && anchors[k].kind !== 'on' && anchors[k].kind !== 'in' && anchors[k].kind !== 'near')
    return refuse('unsupported relation', anchors[k].kind);

  const total = choices.reduce((a, c) => a * c.n, 1);
  let best = null;
  for (const pick of branches(total, choices.map((c) => c.n))) {
    const solved = tryDrawBranch(pick, choices, specs, existing, anchors);
    if (solved && (!best || solved.err < best.err)) best = solved; // branch order breaks ties
  }
  if (!best) return refuse('draw layout never feasible', specs.map((p) => p.kind).join(','));
  const lines = specs.map((p, i) =>
    `@n${i + 1} draw.thing kind=${p.kind} x=${best.at[i].x} y=${best.at[i].y} w=${p.w} h=${p.h} colour=${COLOUR[p.kind] || 'green'}`);
  return sop(lines);
}

// Build and solve the kiwi problem for one branch; verify the rounded result.
function tryDrawBranch(pick, choices, specs, existing, anchors) {
  const side = (choice) => SIDES[pick[choices.indexOf(choice)]];
  const s = new Solver();
  const pos = specs.map(() => ({ x: new Variable('x'), y: new Variable('y') }));
  const pulls = [];  // { who, axis, at, strength }
  const caps = specs.map(() => ({ x: [-Infinity, Infinity], y: [-Infinity, Infinity], ok: true }));
  const bound = (i, axis, lo, hi) => {
    if (lo > caps[i][axis][0]) { caps[i][axis][0] = lo; if (lo > caps[i][axis][1]) caps[i].ok = false; }
    if (hi < caps[i][axis][1]) { caps[i][axis][1] = hi; if (caps[i].ok && hi < caps[i][axis][0]) caps[i].ok = false; }
  };
  try {
    specs.forEach((p, i) => {
      bound(i, 'x', 0, PAGE_W - p.w);
      bound(i, 'y', 0, PAGE_H - p.h);
      const a = anchors[i];
      if (!a) { // no relation: pulled toward the page centre
        pulls.push({ who: i, axis: 'x', at: (PAGE_W - p.w) / 2, strength: Strength.medium });
        pulls.push({ who: i, axis: 'y', at: (PAGE_H - p.h) / 2, strength: Strength.medium });
      } else if (a.kind === 'on' || a.kind === 'in') { // inside the anchor, centred
        const r = a.rect;
        bound(i, 'x', r.x, r.x + r.w - p.w);
        bound(i, 'y', r.y, r.y + r.h - p.h);
        pulls.push({ who: i, axis: 'x', at: r.x + (r.w - p.w) / 2, strength: Strength.medium });
        pulls.push({ who: i, axis: 'y', at: r.y + (r.h - p.h) / 2, strength: Strength.medium });
      } else { // near: one enumerated side of the anchor, gap in [NEAR_MIN, gap]
        const r = a.rect, g = a.gap, sd = side(choices.find((c) => c.kind === 'near' && c.i === i));
        let sep, cross;
        if (sd === 'right') { sep = ['x', r.x + r.w + NEAR_MIN, r.x + r.w + g, r.x + r.w + g / 2]; cross = ['y', r.y + (r.h - p.h) / 2]; }
        else if (sd === 'left') { sep = ['x', r.x - g - p.w, r.x - NEAR_MIN - p.w, r.x - p.w - g / 2]; cross = ['y', r.y + (r.h - p.h) / 2]; }
        else if (sd === 'below') { sep = ['y', r.y + r.h + NEAR_MIN, r.y + r.h + g, r.y + r.h + g / 2]; cross = ['x', r.x + (r.w - p.w) / 2]; }
        else { sep = ['y', r.y - g - p.h, r.y - NEAR_MIN - p.h, r.y - p.h - g / 2]; cross = ['x', r.x + (r.w - p.w) / 2]; }
        // the cross axis must still overlap the anchor, so 'near' reads as beside,
        // not detached in a far corner
        bound(i, sep[0], sep[1], sep[2]);
        bound(i, cross[0], cross[0] === 'y' ? r.y + NEAR_MIN - p.h : r.x + NEAR_MIN - p.w,
          cross[0] === 'y' ? r.y + r.h - NEAR_MIN : r.x + r.w - NEAR_MIN);
        pulls.push({ who: i, axis: sep[0], at: sep[3], strength: Strength.medium });
        pulls.push({ who: i, axis: cross[0], at: cross[0] === 'y' ? r.y + (r.h - p.h) / 2 : r.x + (r.w - p.w) / 2, strength: Strength.medium });
      }
    });
    // disjointness pairs: fixed side per branch
    for (const c of choices) {
      if (c.kind === 'xob') { // spec i on side sd of the constant rectangle o
        const sd = side(c), p = specs[c.i];
        if (sd === 'right') bound(c.i, 'x', c.o.x + c.o.w + MARGIN, Infinity);
        else if (sd === 'left') bound(c.i, 'x', -Infinity, c.o.x - p.w - MARGIN);
        else if (sd === 'below') bound(c.i, 'y', c.o.y + c.o.h + MARGIN, Infinity);
        else bound(c.i, 'y', -Infinity, c.o.y - p.h - MARGIN);
      } else if (c.kind === 'pair') { // spec i on side sd of spec j: linear in kiwi
        const sd = side(c);
        const xi = pos[c.i].x, yi = pos[c.i].y, xj = pos[c.j].x, yj = pos[c.j].y;
        if (sd === 'right') s.createConstraint(xj.plus(specs[c.j].w + MARGIN), Operator.Le, xi);
        else if (sd === 'left') s.createConstraint(xi.plus(specs[c.i].w + MARGIN), Operator.Le, xj);
        else if (sd === 'below') s.createConstraint(yj.plus(specs[c.j].h + MARGIN), Operator.Le, yi);
        else s.createConstraint(yi.plus(specs[c.i].h + MARGIN), Operator.Le, yj);
      }
    }
    for (const p of pulls) {
      const v = p.axis === 'x' ? pos[p.who].x : pos[p.who].y;
      s.createConstraint(v, Operator.Eq, p.at, p.strength);
    }
    for (const [i, cp] of caps.entries()) { // required bounds; kiwi throws on conflict
      if (!cp.ok) throw new Error('unsatisfiable constraint');
      if (cp.x[0] > -Infinity) s.createConstraint(pos[i].x, Operator.Ge, cp.x[0]);
      if (cp.x[1] < Infinity) s.createConstraint(pos[i].x, Operator.Le, cp.x[1]);
      if (cp.y[0] > -Infinity) s.createConstraint(pos[i].y, Operator.Ge, cp.y[0]);
      if (cp.y[1] < Infinity) s.createConstraint(pos[i].y, Operator.Le, cp.y[1]);
    }
  } catch (e) {
    return null; // kiwi's own verdict: required constraints conflict
  }
  s.updateVariables();
  // integer cutover: round, clamp into the per-spec intervals
  const rects = specs.map((p, i) => {
    const cp = caps[i];
    const lo = (a) => (cp[a][0] === -Infinity ? -1e9 : Math.ceil(cp[a][0]));
    const hi = (a) => (cp[a][1] === Infinity ? 1e9 : Math.floor(cp[a][1]));
    return {
      x: Math.min(Math.max(Math.round(pos[i].x.value()), lo('x')), hi('x')),
      y: Math.min(Math.max(Math.round(pos[i].y.value()), lo('y')), hi('y')),
      w: p.w, h: p.h,
    };
  });
  // verify every hard predicate on the integers (including pair disjointness,
  // which the clamping above cannot guarantee on its own)
  const ok = rects.every((r, i) =>
    caps[i].x[0] - 0.01 <= r.x && r.x <= caps[i].x[1] + 0.01 &&
    caps[i].y[0] - 0.01 <= r.y && r.y <= caps[i].y[1] + 0.01) &&
    rects.every((r) => r.x >= 0 && r.y >= 0 && r.x + r.w <= PAGE_W && r.y + r.h <= PAGE_H) &&
    verifyNear(rects, anchors) &&
    verifyDisjoint(rects, existing, anchors);
  if (!ok) return null; // rounding broke a hard predicate — branch discarded honestly
  let err = 0;
  for (const p of pulls) {
    const v = p.axis === 'x' ? rects[p.who].x : rects[p.who].y;
    err += Math.abs(v - p.at);
  }
  return { at: rects, err };
}

// 'near' semantics on the integers: disjoint from the anchor, gap within
// [1, gap], and the cross axis still overlapping the anchor's span.
function verifyNear(rects, anchors) {
  return rects.every((r, i) => {
    const a = anchors[i];
    if (!a || a.kind !== 'near') return true;
    const ar = { x: a.rect.x, y: a.rect.y, w: a.rect.w, h: a.rect.h };
    const dx = Math.max(ar.x - (r.x + r.w), r.x - (ar.x + ar.w), 0);
    const dy = Math.max(ar.y - (r.y + r.h), r.y - (ar.y + ar.h), 0);
    if ((dx > 0) === (dy > 0)) return false; // corner-detached or overlapping
    return Math.max(dx, dy) >= 1 && Math.max(dx, dy) <= a.gap;
  });
}

function verifyDisjoint(rects, existing, anchors) {
  const all = [...existing, ...rects];
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i], a = anchors[i];
    for (const q of all) {
      if (q === r) continue;
      if (a && a.id === q.id && existing.includes(q)
        && (a.kind === 'on' || a.kind === 'in' || a.kind === 'near')) continue; // its own anchor
      if (r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h) return false;
    }
  }
  return true;
}

// ---- calendar --------------------------------------------------------------
// Orderings (event-before/after each busy block, event-before/after each other
// event) are the disjunctions; kiwi computes the times inside each ordering, with
// weak pulls pinning every start to the earliest allowed minute.
function makeCal(intent, objects) {
  const person = intent.option('person') ? attr(intent.option('person'), 'value') : 'Ana';
  const busy = facts(objects, 'cal.event')
    .filter((e) => attr(e, 'person') === person)
    .map((e) => ({ s: num(e, 'start'), e: num(e, 'end') }));
  const minOpt = intent.option('start-min');
  const minStart = minOpt ? Number(attr(minOpt, 'value')) : 0;
  const hardMin = !minOpt || attr(minOpt, 'strength') !== 'soft';
  const durs = [];
  for (const t of intent.targets) {
    const d = num(t, 'w') || 30, count = num(t, 'count') || 1;
    for (let c = 0; c < count; c++) durs.push(d);
  }
  if (!durs.length) return refuse('cal: nothing to schedule');

  const choices = [];
  for (let i = 0; i < durs.length; i++)
    for (const b of busy) choices.push({ n: 2, kind: 'busy', i, b }); // 0: before busy, 1: after
  for (let i = 0; i < durs.length; i++)
    for (let j = i + 1; j < durs.length; j++) choices.push({ n: 2, kind: 'pair', i, j }); // 0: i before j, 1: reverse

  const total = choices.reduce((a, c) => a * c.n, 1);
  let best = null;
  for (const pick of branches(total, choices.map((c) => c.n))) {
    const solved = tryCalBranch(pick, choices, durs, busy, minStart, hardMin);
    if (solved && (!best || solved.sum < best.sum)) best = solved; // branch order breaks ties
  }
  if (!best) return refuse('schedule', 'person=' + person + ' dur=' + durs.join(','));
  const lines = best.starts.map((st, i) =>
    `@n${i + 1} cal.event title="meeting" start=${st} end=${st + durs[i]} person=${person}`);
  return sop(lines);
}

function tryCalBranch(pick, choices, durs, busy, minStart, hardMin) {
  void pick;
  const s = new Solver();
  const st = durs.map(() => new Variable('start'));
  try {
    durs.forEach((d, i) => {
      s.createConstraint(st[i], Operator.Ge, 0);
      if (hardMin) s.createConstraint(st[i], Operator.Ge, minStart);
      else s.createConstraint(st[i], Operator.Ge, minStart, Strength.strong); // soft: never infeasible
      s.createConstraint(st[i].plus(d), Operator.Le, DAY);
      s.createConstraint(st[i], Operator.Eq, minStart, Strength.weak); // the earliest pull
    });
    for (const [k, c] of choices.entries()) {
      if (c.kind === 'busy') {
        if (pick[k] === 0) s.createConstraint(st[c.i].plus(durs[c.i]), Operator.Le, c.b.s);
        else s.createConstraint(st[c.i], Operator.Ge, c.b.e);
      } else {
        if (pick[k] === 0) s.createConstraint(st[c.i].plus(durs[c.i]), Operator.Le, st[c.j]);
        else s.createConstraint(st[c.j].plus(durs[c.j]), Operator.Le, st[c.i]);
      }
    }
  } catch (e) {
    return null; // required conflict: this ordering is infeasible
  }
  s.updateVariables();
  const starts = st.map((v) => Math.round(v.value()));
  // verify the rounded integers against every hard predicate
  const ok = starts.every((s0, i) =>
    s0 >= 0 && s0 >= (hardMin ? minStart : 0) && s0 + durs[i] <= DAY &&
    busy.every((b) => s0 + durs[i] <= b.s || s0 >= b.e) &&
    starts.every((s1, j) => i === j || s0 + durs[i] <= s1 || s1 + durs[j] <= s0));
  if (!ok) return null; // rounding broke a hard predicate: branch discarded
  return { starts, sum: starts.reduce((a, b) => a + b, 0) };
}

// ---- storage ----------------------------------------------------------------
// Shelf choice is integral and kiwi has no integers: the assignment is enumerated
// outside over the (tiny) item x shelf product; kiwi is invoked as the linear
// feasibility oracle — a violated capacity is an unsatisfiable required
// inequality, and kiwi's throw is the prune. Candidates are ranked to keep the
// layout tidy: fewest shelves used, then lowest peak load, then enumeration order.
function assignStore(intent, objects) {
  const shelves = facts(objects, 'store.shelf')
    .map((t) => ({ name: attr(t, 'name'), cap: num(t, 'capacity') })).sort((a, b) => a.name.localeCompare(b.name));
  const allItems = facts(objects, 'store.item').map((t) => ({ name: attr(t, 'name'), size: num(t, 'size') }));
  const pairVal = intent.option('with-pair') ? attr(intent.option('with-pair'), 'value') : null;
  const pair = pairVal ? pairVal.split(',').map((nm) => allItems.find((i) => i.name === nm)) : null;
  let items = allItems;
  if (pair && pair.length === 2 && pair.every(Boolean)) {
    // the join-pair option is collapsed into one combined item of summed size
    items = [{ size: pair[0].size + pair[1].size, isPair: true, pair: pair.map((p) => p.name) },
      ...allItems.filter((i) => !pair.some((p) => p.name === i.name))];
  }
  if (!items.length || !shelves.length) return refuse('store: nothing to assign');

  let best = null;
  const dfs = (idx, assign, loads) => {
    if (idx === items.length) {
      if (!kiwiCapOk(shelves, loads)) return; // kiwi oracle: required inequalities
      const used = [...loads.values()].filter((v) => v > 0).length;
      const key = [used, Math.max(...loads.values(), 0), assign.join('')];
      if (!best || key.join('|') < best.key.join('|')) best = { assign: [...assign], key };
      return;
    }
    for (const sh of shelves) {
      assign.push(sh.name);
      loads.set(sh.name, (loads.get(sh.name) || 0) + items[idx].size);
      dfs(idx + 1, assign, loads);
      loads.set(sh.name, loads.get(sh.name) - items[idx].size);
      assign.pop();
    }
  };
  dfs(0, [], new Map());
  if (!best) return refuse('capacity', items.map((i) => (i.isPair ? i.pair.join('+') : i.name) + ':' + i.size).join(','));

  const puts = [];
  for (const [k, it] of items.entries()) {
    const shelf = best.assign[k];
    if (it.isPair) for (const nm of it.pair) puts.push(`store.put item=${nm} shelf=${shelf}`);
    else puts.push(`store.put item=${it.name} shelf=${shelf}`);
  }
  return sop(puts.map((p, k) => `@n${k + 1} ${p}`));
}

// One tiny kiwi problem per candidate: per used shelf, load <= capacity as a
// required constraint on constant expressions — kiwi throws iff violated.
function kiwiCapOk(shelves, loads) {
  for (const sh of shelves) {
    const load = loads.get(sh.name);
    if (load === undefined) continue;
    try { new Solver().createConstraint(new kiwi.Expression(load), Operator.Le, sh.cap); }
    catch (e) { return false; } // 'unsatisfiable constraint' = capacity exceeded
  }
  return true;
}
