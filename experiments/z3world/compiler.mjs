// Experiment v2: the same z3 machinery as z3/, but the WORLD is now the source of
// the knowledge a real compiler would need — nothing about positions, sizes,
// colours, preferences or rules is hardcoded here:
//
//   - `dc.operation` / `dc.parameter`: the tool's declared capability (the
//     std.capability shapes). Parameter names, ranges and enums fix the variables
//     and their domains.
//   - `lr.rule`: form-specific rules in the world ("boats go inside lake-kind
//     areas", "houses avoid them") -> conditional hard constraints.
//   - `lr.grade`: word tables as facts ("small" = 0.5 scale) -> size derivation,
//     not code tables.
//   - `lr.pref`: session preferences persisted in the world -> objective terms.
//   - `demo.part`: real composition data (the real Not sailboat parts from
//     k.objects) -> one rigid group, every part emitted as its own elementary wire.
//
// Requests that are not search (act=inspect questions) take the reading path:
// match over the instance, answer wire out. z3 is the search step of the
// pipeline, not the whole compiler.
import { wires, attr, num, of, instanceOf } from '../common/lib.mjs';

const COLOUR = { sun: 'yellow', boat: 'brown', tree: 'green', house: 'red', circle: 'blue', lake: 'blue', rectangle: 'green', mast: 'grey', sail: 'red' };

let z3Ctx;
const z3 = async () => (z3Ctx ||= (async () => { const m = await import('z3-solver'); const em = await m.init(); return new em.Context('world'); })());

export const compile = async (caseDef) => {
  try {
    const z = await z3();
    const intent = readIntent(caseDef.intent);
    const objects = instanceOf(caseDef.world);
    if (intent.act === 'inspect') return inspect(objects, intent);
    if (intent.act === 'change') return move(z, intent, objects);
    if (caseDef.family === 'draw') return makeDraw(z, intent, objects);
    if (caseDef.family === 'cal') return makeCal(z, intent, objects);
    if (caseDef.family === 'store') return assign(z, intent, objects);
    return { ok: false, reason: 'unknown-family' };
  } catch (e) {
    return { ok: false, reason: 'error: ' + String(e.message).split('\n')[0].slice(0, 160) };
  }
};

const sop = (lines) => ({ ok: true, sop: lines.join('\n') + '\n' });
const refuse = (reason, core) => ({ ok: false, reason: 'unsat: ' + reason + (core?.length ? ' — conflicting: ' + core.join(' + ') : '') });

// z3-solver binding: term.add(...) is not variadic — sums are built by chaining.
const sumTerm = (z, terms) => terms.reduce((acc, t) => acc.add(t), z.Int.val(0));

const readIntent = (text) => {
  const ws = wires(text);
  const option = (k) => of(ws, 'x.option').find((o) => attr(o, 'key') === k);
  return { act: attr(of(ws, 'x.intent')[0], 'act'), note: attr(of(ws, 'x.intent')[0], 'note'), targets: of(ws, 'x.target'), rels: of(ws, 'x.rel'), option };
};

const kindsOf = (objects, type) => [...objects.values()].filter((t) => t.type === type);
const rectsOf = (objects) => kindsOf(objects, 'draw.thing').map((t) => ({ id: t.id, kind: attr(t, 'kind'), x: num(t, 'x'), y: num(t, 'y'), w: num(t, 'w'), h: num(t, 'h') }));
const byName = (objects, id) => objects.get(id) || [...objects.values()].find((t) => t.attrs.name?.[0] === id);

// world-carried knowledge ---------------------------------------------------
const ruleFacts = (objects, kind) =>
  kindsOf(objects, 'lr.rule')
    .filter((r) => attr(r, 'for') === kind)
    .map((r) => ({ for: attr(r, 'for'), rel: attr(r, 'relation'), anchorKind: r.attrs['anchor-kind']?.[0], strength: attr(r, 'strength') || 'hard' }));

const gradeOf = (objects, kind, word) =>
  kindsOf(objects, 'lr.grade').find((g) => attr(g, 'word') === word && (!attr(g, 'kind') || attr(g, 'kind') === kind || attr(g, 'kind') === 'any'));

const prefsOf = (objects) => kindsOf(objects, 'lr.pref').map((p) => ({ person: attr(p, 'person'), value: attr(p, 'value') }));

// declared capability: parameter names, ranges and enums fix the domains
const paramDomains = (objects, act) => {
  const op = kindsOf(objects, 'dc.operation').find((o) => attr(o, 'act') === act);
  if (!op) return null;
  const dom = {};
  for (const p of kindsOf(objects, 'dc.parameter').filter((p) => attr(p, 'operation') === '$' + op.id)) {
    dom[attr(p, 'param')] = p.attrs.accepts?.length
      ? { kind: 'enum', values: [...p.attrs.accepts] }
      : { kind: 'number', min: num(p, 'min') ?? -Infinity, max: num(p, 'max') ?? Infinity };
  }
  return dom;
};

// ---- drawing --------------------------------------------------------------
async function makeDraw(z, intent, objects) {
  const all = (n) => z.Int.val(n);
  const dom = paramDomains(objects, 'make') ?? { x: { min: 0, max: 800 }, y: { min: 0, max: 600 } };
  const things = rectsOf(objects);
  const parts = kindsOf(objects, 'demo.part');
  const hard = [], made = [];
  const excludedFromObstacles = (kind) =>
    ruleFacts(objects, kind).filter((r) => r.rel === 'in').map((r) => r.anchorKind);
  let k = 0;
  for (const t of intent.targets.filter((x) => attr(x, 'mode') === 'new')) {
    const kind = attr(t, 'kind');
    const rel = intent.rels.find((r) => attr(r, 'target') === '$' + t.id);
    const grp = parts.filter((p) => attr(p, 'of') === kind); // real composition from k.objects
    if (grp.length) { // a real multi-part thing: one rigid group
      const ox = z.Int.const(`gx${k}`), oy = z.Int.const(`gy${k}`);
      const offx = Math.min(...grp.map((p) => num(p, 'x'))), offy = Math.min(...grp.map((p) => num(p, 'y')));
      const gw = Math.round(Math.max(...grp.map((p) => num(p, 'x') + num(p, 'w'))) - offx); // integer bounds for the solver; the parts keep their exact Noto geometry
      const gh = Math.round(Math.max(...grp.map((p) => num(p, 'y') + num(p, 'h'))) - offy);
      made.push({ kind, group: true, ox, oy, parts: grp.map((p) => ({ kind: attr(p, 'name'), x: num(p, 'x'), y: num(p, 'y'), w: num(p, 'w'), h: num(p, 'h'), colour: attr(p, 'colour') })) });
      hard.push([`gbounds${k}`, z.And(ox.ge(all(0)), oy.ge(all(0)), ox.add(gw).le(all(800)), oy.add(gh).le(all(600)))]);
      if (rel && ['on', 'in'].includes(attr(rel, 'kind'))) {
        const anchor = byName(objects, attr(rel, 'anchor'));
        const a = { x: num(anchor, 'x'), y: num(anchor, 'y'), w: num(anchor, 'w'), h: num(anchor, 'h') };
        hard.push([`inside:${attr(rel, 'anchor')}`, z.And(ox.ge(all(a.x)), oy.ge(all(a.y)), ox.add(gw).le(all(a.x + a.w)), oy.add(gh).le(all(a.y + a.h)))]);
      }
      const gAnchor = rel && ['on', 'in'].includes(attr(rel, 'kind')) ? attr(rel, 'anchor') : null;
      for (const q of things) if (q.id !== gAnchor) hard.push([`gdisj${k}:${q.id}`, z.Or(ox.add(gw).le(all(q.x)), all(q.x + q.w).le(ox), oy.add(gh).le(all(q.y)), all(q.y + q.h).le(oy))]);
      k++; continue;
    }
    let w = num(t, 'w') || 40, h = num(t, 'h') || 40;
    const word = intent.option('size') && attr(intent.option('size'), 'value'); // the world's word table
    const grade = word && gradeOf(objects, kind, word);
    if (grade) { const s = num(grade, 'scale'); w = Math.round(w * s); h = Math.round(h * s); }
    const count = num(t, 'count') || 1;
    const rules = ruleFacts(objects, kind);
    const ruleAnchorKinds = rules.flatMap((r) => r.rel === 'in' ? [r.anchorKind] : []);
    const inAnchorIds = things.filter((q) => ruleAnchorKinds.includes(q.kind)).map((q) => q.id);
    const relIds = rel && ['on', 'in'].includes(attr(rel, 'kind')) ? [attr(rel, 'anchor')] : [];
    for (let c = 0; c < count; c++) {
      const x = z.Int.const(`x${k}`), y = z.Int.const(`y${k}`);
      made.push({ kind, w, h, x, y });
      hard.push([`bounds${k}`, z.And(x.ge(all(dom.x?.min ?? 0)), y.ge(all(dom.y?.min ?? 0)), x.add(w).le(all(Math.min(dom.x?.max ?? 800, 800))), y.add(h).le(all(Math.min(dom.y?.max ?? 600, 600))))]);
      if (rel) {
        const anchor = byName(objects, attr(rel, 'anchor'));
        const a = { x: num(anchor, 'x'), y: num(anchor, 'y'), w: num(anchor, 'w'), h: num(anchor, 'h') };
        const rk = attr(rel, 'kind'), gap = num(rel, 'gap') ?? 40;
        if (rk === 'on' || rk === 'in')
          hard.push([`inside:${attr(rel, 'anchor')}`, z.And(x.ge(all(a.x)), y.ge(all(a.y)), x.add(w).le(all(a.x + a.w)), y.add(h).le(all(a.y + a.h)))]);
        else if (rk === 'near') {
          const dx = z.If(x.add(w).le(all(a.x)), all(a.x).sub(x.add(w)), z.If(all(a.x + a.w).le(x), x.sub(all(a.x + a.w)), z.Int.val(0)));
          const dy = z.If(y.add(h).le(all(a.y)), all(a.y).sub(y.add(h)), z.If(all(a.y + a.h).le(y), y.sub(all(a.y + a.h)), z.Int.val(0)));
          const disjoint = z.Or(x.add(w).le(all(a.x)), all(a.x + a.w).le(x), y.add(h).le(all(a.y)), all(a.y + a.h).le(y));
          hard.push([`near:${attr(rel, 'anchor')}`, z.And(disjoint, dx.le(all(gap)), dy.le(all(gap)))]);
        }
      }
      for (const r of rules) { // world rules for this form
        for (const a of things.filter((q) => q.kind === r.anchorKind)) {
          if (r.rel === 'in') hard.push([`rule:${r.for}:in:${a.id}`, z.And(x.ge(all(a.x)), y.ge(all(a.y)), x.add(w).le(all(a.x + a.w)), y.add(h).le(all(a.y + a.h)))]);
          else if (r.rel === 'avoid') hard.push([`rule:${r.for}:avoid:${a.id}`, z.Or(x.add(w).le(a.x ? all(a.x) : all(0)), all(a.x + a.w).le(x), y.add(h).le(all(a.y)), all(a.y + a.h).le(y))]);
        }
      }
      for (const q of things)
        if (!inAnchorIds.includes(q.id) && !relIds.includes(q.id)) // the rule's target-area is home, not an obstacle
          hard.push([`disj${k}:${q.id}`, z.Or(x.add(w).le(all(q.x)), all(q.x + q.w).le(x), y.add(h).le(all(q.y)), all(q.y + q.h).le(y))]);
      k++;
    }
  }
  for (let i = 0; i < made.length; i++) for (let j = i + 1; j < made.length; j++) {
    if (made[i].group || made[j].group) continue;
    const a = made[i], b = made[j];
    hard.push([`pair${i}${j}`, z.Or(a.x.add(a.w).le(b.x), b.x.add(b.w).le(a.x), a.y.add(a.h).le(b.y), b.y.add(b.h).le(a.y))]);
  }
  const dist = (t, mid) => z.If(t.ge(all(mid)), t.sub(all(mid)), all(mid).sub(t));
  const plain = made.filter((m) => !m.group);
  const objective = plain.length
    ? sumTerm(z, plain.flatMap((m) => [dist(m.x.add(m.w / 2), 400), dist(m.y.add(m.h / 2), 300)]))
    : null;
  const r = await solveTracked(z, hard, objective);
  if (!r.sat) return refuse('draw', r.core);
  const val = (v) => Number(/-?\d+/.exec(String(r.model.get(v)))[0]);
  const lines = [];
  let n = 0;
  for (const m of made) {
    if (m.group) {
      const ox = val(m.ox), oy = val(m.oy);
      const offx = Math.min(...m.parts.map((p) => p.x)), offy = Math.min(...m.parts.map((p) => p.y));
      const mx = Math.round(ox - offx), my = Math.round(oy - offy);
      for (const p of m.parts) lines.push(`@n${++n} draw.thing kind=${p.kind} x=${Math.round(p.x + mx)} y=${Math.round(p.y + my)} w=${p.w} h=${p.h} colour=${p.colour}`);
    } else {
      lines.push(`@n${++n} draw.thing kind=${m.kind} x=${val(m.x)} y=${val(m.y)} w=${m.w} h=${m.h} colour=${COLOUR[m.kind] || 'green'}`);
    }
  }
  return sop(lines);
}

// ---- calendar with persisted preferences ----------------------------------
async function makeCal(z, intent, objects) {
  const all = (n) => z.Int.val(n);
  const person = intent.option('person') ? attr(intent.option('person'), 'value') : 'Ana';
  const busy = kindsOf(objects, 'cal.event').filter((e) => attr(e, 'person') === person)
    .map((e) => ({ title: attr(e, 'title'), s: num(e, 'start'), e: num(e, 'end') }));
  const dom = paramDomains(objects, 'make');
  const hi = Math.min(dom?.end?.max ?? 480, 480);
  const minStart = intent.option('start-min') ? Number(attr(intent.option('start-min'), 'value')) : 0;
  const hard = [], events = [];
  let k = 0;
  for (const t of intent.targets) {
    const dur = num(t, 'w') || 30, count = num(t, 'count') || 1;
    for (let c = 0; c < count; c++) {
      const v = z.Int.const(`t${k}`);
      events.push({ v, dur });
      hard.push([`day${k}`, z.And(v.ge(all(minStart)), v.add(dur).le(all(hi)))]);
      for (const b of busy) hard.push([`busy${k}:${b.title}`, z.Or(v.add(dur).le(all(b.s)), all(b.e).le(v))]);
      for (let p = 0; p < events.length - 1; p++) hard.push([`order${k}:${p}`, z.Or(v.add(dur).le(events[p].v), events[p].v.add(events[p].dur).le(v))]);
      k++;
    }
  }
  const pref = prefsOf(objects).find((p) => p.person === person); // persisted session preference
  let objective = null;
  if (events.length) {
    const LATE = 240;
    objective = sumTerm(z, events.map((e) => pref?.value === 'late' ? e.v.add(z.If(e.v.ge(all(LATE)), all(0), all(1000))) : e.v));
  }
  const r = await solveTracked(z, hard, objective);
  if (!r.sat) return refuse('schedule', r.core);
  return sop(events.map((e, i) => {
    const s = Number(/-?\d+/.exec(String(r.model.get(e.v)))[0]);
    return `@n${i + 1} cal.event title="meeting" start=${s} end=${s + e.dur} person=${person}`;
  }));
}

// ---- storage ----------------------------------------------------------------
async function assign(z, intent, objects) {
  const all = (n) => z.Int.val(n);
  const shelves = kindsOf(objects, 'store.shelf').map((t) => ({ name: attr(t, 'name'), cap: num(t, 'capacity') }));
  const items = kindsOf(objects, 'store.item').map((t) => ({ name: attr(t, 'name'), size: num(t, 'size') }));
  const pairNames = intent.option('with-pair') ? attr(intent.option('with-pair'), 'value').split(',') : null;
  const shelfOf = new Map(items.map((it) => [it.name, z.Int.const('s_' + it.name)]));
  const hard = [];
  for (const it of items) hard.push([`dom:${it.name}`, z.And(shelfOf.get(it.name).ge(all(0)), shelfOf.get(it.name).lt(all(shelves.length)))]);
  shelves.forEach((sh, s) => {
    const load = sumTerm(z, items.map((it) => z.If(shelfOf.get(it.name).eq(all(s)), all(it.size), all(0))));
    hard.push([`cap:${sh.name}`, load.le(all(sh.cap))]);
  });
  if (pairNames && pairNames.every((nm) => shelfOf.has(nm)))
    hard.push(['pair:' + pairNames.join('+'), shelfOf.get(pairNames[0]).eq(shelfOf.get(pairNames[1]))]);
  const used = shelves.map((sh, s) => z.If(z.Or(...items.map((it) => shelfOf.get(it.name).eq(all(s)))), z.Int.val(1), z.Int.val(0)));
  const objective = sumTerm(z, used);
  const r = await solveTracked(z, hard, objective);
  if (!r.sat) return refuse('assign', r.core);
  return sop(items.map((it, i) => {
    const idx = Number(/-?\d+/.exec(String(r.model.get(shelfOf.get(it.name))))[0]);
    return `@n${i + 1} store.put item=${it.name} shelf=${shelves[idx].name}`;
  }));
}

// ---- move an existing thing ----------------------------------------------
async function move(z, intent, objects) {
  const all = (n) => z.Int.val(n);
  const t = intent.targets[0];
  const rel = intent.rels.find((r) => attr(r, 'target') === '$' + t.id);
  const cands = kindsOf(objects, 'draw.thing').filter((o) => attr(o, 'kind') === attr(t, 'kind'));
  if (!cands.length) return refuse('move: nothing matches', [attr(t, 'kind')]);
  const target = cands[0], w = num(target, 'w'), h = num(target, 'h');
  const x = z.Int.const('mx'), y = z.Int.const('my');
  const anchor = byName(objects, attr(rel, 'anchor'));
  const a = { x: num(anchor, 'x'), y: num(anchor, 'y'), w: num(anchor, 'w'), h: num(anchor, 'h') };
  const ty = num(target, 'y');
  const hard = [['bounds', z.And(x.ge(all(0)), y.ge(all(0)), x.add(w).le(all(800)), y.add(h).le(all(600)))]];
  const rk = attr(rel, 'kind');
  if (rk === 'right') { hard.push(['right', x.ge(all(a.x + a.w))]); hard.push(['right-gap', x.sub(all(a.x + a.w)).le(all(40))]); }
  else if (rk === 'left') { hard.push(['left', x.add(w).le(all(a.x))]); hard.push(['left-gap', all(a.x).sub(x.add(w)).le(all(40))]); }
  else if (rk === 'below') { hard.push(['below', y.ge(all(a.y + a.h))]); hard.push(['below-gap', y.sub(all(a.y + a.h)).le(all(40))]); }
  for (const q of kindsOf(objects, 'draw.thing').filter((o) => o.id !== target.id))
    hard.push([`disj:${q.id}`, z.Or(x.add(w).le(all(num(q, 'x'))), all(num(q, 'x') + num(q, 'w')).le(x), y.add(h).le(all(num(q, 'y'))), all(num(q, 'y') + num(q, 'h')).le(y))]);
  hard.push(['same-row', y.eq(all(ty))]); // a move is a translation on the requested axis
  const r = await solveTracked(z, hard, x); // prefer the smallest move
  if (!r.sat) return refuse('move', r.core);
  const nx = Number(/-?\d+/.exec(String(r.model.get(x)))[0]);
  return sop([`@n1 x.set object=${target.id} key=x value=${nx}`]);
}

// ---- read path: questions are not solver requests ------------------------
function inspect(objects, intent) {
  const t = intent.targets[0];
  const op = intent.option('operation') && attr(intent.option('operation'), 'value');
  const matches = kindsOf(objects, 'draw.thing').filter((o) => attr(o, 'kind') === attr(t, 'kind'));
  if (op === 'count') return sop([`@n1 x.answer text="${matches.length}"`]);
  return sop([`@n1 x.answer text="${matches.map((m) => m.id).join(', ')}"`]);
}

// shared solve+explain (same discipline as z3/: plain Optimize.solve, tracked Solver for the core)
async function solveTracked(z, hard, objective) {
  const opt = new z.Optimize();
  for (const [, c] of hard) await opt.add(c);
  if (objective) await opt.minimize(objective);
  const r = String(await opt.check());
  if (r === 'sat') return { sat: true, model: await opt.model() };
  if (r !== 'unsat') return { sat: false, core: [r] };
  const s = new z.Solver();
  for (const [name, c] of hard) await s.addAndTrack(c, name);
  await s.check();
  const vec = s.unsatCore();
  const entries = vec?.values ? vec.values() : [];
  return { sat: false, core: [...entries].map((t) => String(t)).slice(0, 6) };
}
