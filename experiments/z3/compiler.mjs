// Experiment: elaboration as SMT. One z3 problem per intent packet:
// open parameters (positions, times, shelf indices) are integer variables, intent
// relations become hard constraints, preferences become the optimization objective.
// A refusal is not a string: when the problem is unsat, the unsat core names the
// conflicting hard constraints, and that list is the refusal reason.
//
// z3-solver is fully async here; compile() returns a Promise. Every plain number is
// lifted into a z3 term before comparison — raw JS `number <= term` silently corrupts
// constraints (lesson from the first run of this experiment).
import { wires, attr, num, of, instanceOf } from '../common/lib.mjs';

const DAY = 480;
const COLOUR = { sun: 'yellow', boat: 'brown', tree: 'green', house: 'red', circle: 'blue', lake: 'blue', rectangle: 'green' };

let ctxPromise;
const z3 = async () => (ctxPromise ||= (async () => { const m = await import('z3-solver'); const em = await m.init(); return new em.Context('main'); })());

export const compile = async (caseDef) => {
  try {
    const z = await z3();
    const intent = readIntent(caseDef.intent);
    const objects = instanceOf(caseDef.world);
    if (intent.act === 'change') return changeOne(intent, objects);
    if (caseDef.family === 'draw') return draw(z, intent, objects);
    if (caseDef.family === 'cal') return cal(z, intent, objects);
    if (caseDef.family === 'store') return store(z, intent, objects);
    return { ok: false, reason: 'unknown-family' };
  } catch (e) {
    return { ok: false, reason: 'error: ' + String(e.message).split('\n')[0].slice(0, 160) };
  }
};

const sop = (lines) => ({ ok: true, sop: lines.join('\n') + '\n' });
const refuse = (reason, core) => ({ ok: false, reason: 'unsat: ' + reason + (core?.length ? ' — conflicting: ' + core.join(' + ') : ''), core: core || [] });

// z3-solver quirk No. 2 found by this experiment: term.add(...) is not variadic —
// a spread collapses the sum to its first element. Sums are built by chaining.
const sumTerm = (z, terms) => terms.reduce((acc, t) => acc.add(t), z.Int.val(0));

const readIntent = (text) => {
  const ws = wires(text);
  const option = (k) => of(ws, 'x.option').find((o) => attr(o, 'key') === k);
  return { act: attr(of(ws, 'x.intent')[0], 'act'), targets: of(ws, 'x.target'), rels: of(ws, 'x.rel'), option };
};
const facts = (objects, type) => [...objects.values()].filter((t) => t.type === type);
const rectOf = (t) => ({ x: num(t, 'x'), y: num(t, 'y'), w: num(t, 'w'), h: num(t, 'h') });
const byName = (objects, id) => objects.get(id) || [...objects.values()].find((t) => t.attrs.name?.[0] === id);

const valueOf = (model, v) => {
  const m = /-?\d+/.exec(String(model.get(v)));
  return m ? Number(m[0]) : undefined;
};

// solve+optimize with real hard constraints; explain with a tracked solver.
// z3-solver quirk found by this experiment: on Optimize, addAndTrack turns each
// constraint into `freeTag => constraint`, and the optimizer flips tags to false
// to minimize the objective. On a plain Solver the tags are assumed automatically
// and unsatCore() names them — so that is where the refusal explanation comes from.
async function solveTracked(z, hard, objective) {
  const opt = new z.Optimize();
  await opt.set('timeout', 8000);
  for (const [, c] of hard) await opt.add(c);
  if (objective) await opt.minimize(objective);
  const r = String(await opt.check());
  if (r === 'sat') return { sat: true, model: await opt.model() };
  if (r !== 'unsat') return { sat: false, core: [r] };
  const s = new z.Solver();
  await s.set('timeout', 8000);
  for (const [name, c] of hard) await s.addAndTrack(c, name);
  await s.check();
  const vec = s.unsatCore();
  const entries = vec?.values ? vec.values() : [];
  return { sat: false, core: [...entries].map((t) => String(t)).slice(0, 6) };
}
// (rect-gap terms are inlined in the `near` constraint below)
async function draw(z, intent, objects) {
  const all = (n) => z.Int.val(n);
  // (rect-axis gaps are inlined in the `near` constraint)
  const rectThings = facts(objects, 'draw.thing').map((t) => ({ id: t.id, kind: attr(t, 'kind'), ...rectOf(t) }));
  const hard = [], made = [];
  let k = 0;
  for (const t of intent.targets.filter((x) => attr(x, 'mode') === 'new')) {
    const kind = attr(t, 'kind'), w = num(t, 'w') || 40, h = num(t, 'h') || 40;
    const count = num(t, 'count') || 1;
    const rel = intent.rels.find((r) => attr(r, 'target') === '$' + t.id);
    for (let c = 0; c < count; c++) {
      const x = z.Int.const(`x${k}`), y = z.Int.const(`y${k}`);
      made.push({ kind, w, h, x, y });
      hard.push([`bounds${k}`, z.And(x.ge(all(0)), y.ge(all(0)), x.add(w).le(all(800)), y.add(h).le(all(600)))]);
      let obstacles = [...rectThings];
      if (rel) {
        const anchor = byName(objects, attr(rel, 'anchor'));
        if (!anchor) return refuse('unknown-anchor', [attr(rel, 'anchor')]);
        const a = rectOf(anchor), rk = attr(rel, 'kind'), gap = num(rel, 'gap') ?? 40;
        if (rk === 'on' || rk === 'in') {
          hard.push([`inside:${anchor.id}`, z.And(x.ge(all(a.x)), y.ge(all(a.y)), x.add(w).le(all(a.x + a.w)), y.add(h).le(all(a.y + a.h)))]);
          obstacles = obstacles.filter((o) => o.id !== anchor.id);
        } else if (rk === 'near') {
          const dx = z.If(x.add(w).le(all(a.x)), all(a.x).sub(x.add(w)), z.If(all(a.x + a.w).le(x), x.sub(all(a.x + a.w)), z.Int.val(0)));
          const dy = z.If(y.add(h).le(all(a.y)), all(a.y).sub(y.add(h)), z.If(all(a.y + a.h).le(y), y.sub(all(a.y + a.h)), z.Int.val(0)));
          const disjoint = z.Or(x.add(w).le(all(a.x)), all(a.x + a.w).le(x), y.add(h).le(all(a.y)), all(a.y + a.h).le(y));
          hard.push([`near:${anchor.id}`, z.And(disjoint, dx.le(all(gap)), dy.le(all(gap)))]);
        }
      }
      for (const q of obstacles)
        hard.push([`disj${k}:${q.id}`, z.Or(x.add(w).le(all(q.x)), all(q.x + q.w).le(x), y.add(h).le(all(q.y)), all(q.y + q.h).le(y))]);
      k++;
    }
  }
  for (let i = 0; i < made.length; i++) for (let j = i + 1; j < made.length; j++) {
    const a = made[i], b = made[j];
    hard.push([`pair${i}${j}`, z.Or(a.x.add(a.w).le(b.x), b.x.add(b.w).le(a.x), a.y.add(a.h).le(b.y), b.y.add(b.h).le(a.y))]);
  }
  // preference: keep the cluster near the page middle (Manhattan distance)
  const dist = (t, mid) => z.If(t.ge(all(mid)), t.sub(all(mid)), all(mid).sub(t));
  const objective = made.length
    ? sumTerm(z, made.flatMap((m) => [dist(m.x.add(m.w / 2), 400), dist(m.y.add(m.h / 2), 300)]))
    : null;
  const r = await solveTracked(z, hard, objective);
  if (!r.sat) return refuse('draw', r.core);
  return sop(made.map((m, i) => {
    const x = valueOf(r.model, m.x), y = valueOf(r.model, m.y);
    return `@n${i + 1} draw.thing kind=${m.kind} x=${x} y=${y} w=${m.w} h=${m.h} colour=${COLOUR[m.kind] || 'green'}`;
  }));
}

// ---- one state change ------------------------------------------------------
function changeOne(intent, objects) {
  const t = intent.targets[0];
  const value = intent.option('colour') && attr(intent.option('colour'), 'value');
  const cands = facts(objects, 'draw.thing').filter((o) =>
    (!attr(t, 'kind') || attr(o, 'kind') === attr(t, 'kind')) &&
    (!attr(t, 'colour') || attr(o, 'colour') === attr(t, 'colour')));
  if (!value || !cands.length) return refuse('change: nothing matches', [attr(t, 'kind') || '?']);
  return sop([`@n1 x.set object=${cands[0].id} key=colour value=${value}`]);
}

// ---- calendar --------------------------------------------------------------
async function cal(z, intent, objects) {
  const all = (n) => z.Int.val(n);
  const person = intent.option('person') ? attr(intent.option('person'), 'value') : 'Ana';
  const busy = facts(objects, 'cal.event').filter((e) => attr(e, 'person') === person)
    .map((e) => ({ title: attr(e, 'title'), s: num(e, 'start'), e: num(e, 'end') }));
  const minStart = intent.option('start-min') ? Number(attr(intent.option('start-min'), 'value')) : 0;
  const hard = [], events = [];
  let k = 0;
  for (const t of intent.targets) {
    const dur = num(t, 'w') || 30, count = num(t, 'count') || 1;
    for (let c = 0; c < count; c++) {
      const v = z.Int.const(`t${k}`);
      events.push({ v, dur });
      hard.push([`day${k}`, z.And(v.ge(all(minStart)), v.add(dur).le(all(DAY)))]);
      for (const b of busy) hard.push([`busy:${b.title}`, z.Or(v.add(dur).le(all(b.s)), all(b.e).le(v))]);
      for (const e of events.slice(0, -1)) hard.push([`order${k}`, z.Or(v.add(dur).le(e.v), e.v.add(e.dur).le(v))]);
      k++;
    }
  }
  const objective = events.length ? sumTerm(z, events.map((e) => e.v)) : null; // earliest wins
  const r = await solveTracked(z, hard, objective);
  if (!r.sat) return refuse('schedule', r.core);
  return sop(events.map((e, i) => {
    const s = valueOf(r.model, e.v);
    return `@n${i + 1} cal.event title="meeting" start=${s} end=${s + e.dur} person=${person}`;
  }));
}

// ---- storage --------------------------------------------------------------
async function store(z, intent, objects) {
  const all = (n) => z.Int.val(n);
  const shelves = facts(objects, 'store.shelf').map((t) => ({ name: attr(t, 'name'), cap: num(t, 'capacity') }));
  const items = facts(objects, 'store.item').map((t) => ({ name: attr(t, 'name'), size: num(t, 'size') }));
  const pairNames = intent.option('with-pair') ? attr(intent.option('with-pair'), 'value').split(',') : null;
  const shelfOf = new Map(items.map((it) => [it.name, z.Int.const('s_' + it.name)]));
  const hard = [];
  for (const it of items) hard.push([`dom:${it.name}`, z.And(shelfOf.get(it.name).ge(all(0)), shelfOf.get(it.name).lt(all(shelves.length)))]);
  shelves.forEach((sh, s) => { // capacity per shelf
    const load = sumTerm(z, items.map((it) => z.If(shelfOf.get(it.name).eq(all(s)), all(it.size), all(0))));
    hard.push([`cap:${sh.name}`, load.le(all(sh.cap))]);
  });
  if (pairNames && pairNames.every((nm) => shelfOf.has(nm)))
    hard.push(['pair:' + pairNames.join('+'), shelfOf.get(pairNames[0]).eq(shelfOf.get(pairNames[1]))]);
  const used = shelves.map((sh, s) =>
    z.If(z.Or(...items.map((it) => shelfOf.get(it.name).eq(all(s)))), z.Int.val(1), z.Int.val(0)));
  const objective = sumTerm(z, used); // prefer fewer shelves touched
  const r = await solveTracked(z, hard, objective);
  if (!r.sat) return refuse('assign', r.core);
  return sop(items.map((it, i) => {
    const idx = valueOf(r.model, shelfOf.get(it.name));
    return `@n${i + 1} store.put item=${it.name} shelf=${shelves[idx].name}`;
  }));
}
