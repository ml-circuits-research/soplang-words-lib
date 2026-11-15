// Tool binding as wires, executed by the library (owner 2026-11-15 19:27: the link between a live world and the
// generic mechanisms is declarative; only the tool's concrete actions are code).
//
//   toolBindings(live, { catalog })                     -> the std.tool.* declarations of a world, checked
//   runPlan(plan, bindings, primitives, { view, ... })  -> each step through its binding: arguments filled and
//                                                          translated by knowledge, preconditions checked, the primitive
//                                                          called, the view read before / after; the result is a diff;
//                                                          the timeline (one plan = one undo step) is kept here
//   runPlan(live, plan, { replace })                    -> a world without a tool: the steps through its own `act`
//   toolSession(live, primitives, { language, ... })    -> read, revise, plan, run, say: the door, with no code per world
//
// A primitive is a small typed operation (`add({ kind, n, size })`); it never reads the request, holds no words and no
// defaults. The view is the tool's state as facts. A custom constraint or search is a named function declared in the
// world (`std.tool.custom`) with its signature. Nothing here names a world, a kind or a sentence.
import { rowsOf, kindLineage, expectedValue } from './expect.mjs';
import { readRequest, reviseRequest, planRequest, runWorldPlan, sayRequest, capabilitiesOf } from './request.mjs';
import { quote } from './parser.mjs';

const first = (o, k) => o?.[k]?.[0];
const strip = (v) => String(v).replace(/^\$/, '');
const plainKind = (k) => String(k).split('.').pop().replace(/_/g, ' ');
const num = (x) => (x === undefined || x === null || x === '' ? undefined : Number(x));
/** The source forms of an argument (`arg=<param><-<source>|<source>...`). */
export const TOOL_ARG_SOURCES = Object.freeze(['step', 'request', 'state', 'result', 'plan', 'custom', 'value', 'expect']);
const BUILTIN_NEEDS = new Set(['exists', 'absent']);

// ---- declarations ------------------------------------------------------------------------------------------------
const parseArg = (text) => {
  const at = String(text).indexOf('<-');
  if (at < 0) return { name: String(text), sources: [] };
  return { name: String(text).slice(0, at), sources: String(text).slice(at + 2).split('|').filter(Boolean) };
};
const parseCall = (text) => { const m = String(text).match(/^([\w.]+)\s*\(([^)]*)\)$/); return m ? { name: m[1], args: m[2].split(',').map((x) => x.trim()).filter(Boolean) } : { name: String(text), args: [] }; };

/**
 * The tool binding a world declares: `std.tool.op name= world= param= effect=`, `std.tool.param op= name= type= accepts=
 * scale= by= order= min= max= required=`, `std.tool.bind act= of= op= arg=<param><-<source>|... needs= makes= removes=
 * changes=`, `std.tool.custom name= kind=constraint|search in= out= fails=`, `std.tool.value op= param= value= as=` (the
 * tool's own name for an accepted value of the world: the call gets `as`). Returns { ops, params, binds, customs,
 * problems } (problems: an op, a parameter, a source form or a custom function a binding names that is not declared).
 */
export function toolBindings(live, { catalog = [] } = {}) {
  const ops = new Map(), params = new Map(), customs = new Map(), problems = [];
  for (const r of rowsOf(live, 'std.tool.op')) ops.set(first(r, 'name'), { name: first(r, 'name'), world: first(r, 'world'), params: r.param ?? [], effects: r.effect ?? [], doc: first(r, 'doc') });
  for (const r of rowsOf(live, 'std.tool.param')) {
    const op = first(r, 'op'), m = params.get(op) ?? new Map();
    m.set(first(r, 'name'), { op, name: first(r, 'name'), kind: first(r, 'kind'), type: first(r, 'type'), accepts: (r.accepts ?? []).map(String), scale: first(r, 'scale'), by: first(r, 'by'), order: first(r, 'order'), min: num(first(r, 'min')), max: num(first(r, 'max')), default: first(r, 'default'), required: ['yes', 'true', true].includes(first(r, 'required')) });
    params.set(op, m);
  }
  // the tool's own name for a value of the world (std.tool.value op= param= value= as=): the call gets `as`
  for (const r of rowsOf(live, 'std.tool.value')) { const p = params.get(first(r, 'op'))?.get(first(r, 'param')); if (p) (p.names ??= new Map()).set(String(first(r, 'value')), first(r, 'as')); }
  for (const r of rowsOf(live, 'std.tool.custom')) customs.set(first(r, 'name'), { name: first(r, 'name'), kind: first(r, 'kind') ?? 'constraint', in: r.in ?? [], out: first(r, 'out'), fails: first(r, 'fails') });
  // a binding's arguments: inline (arg=<param><-<source>|...) or one std.tool.arg wire each (bind=$<binding> param= from=...)
  const argRows = (live?.ofType?.('std.tool.arg') ?? []).map((f) => ({ bind: strip(f.attrs.bind?.[0] ?? ''), param: String(f.attrs.param?.[0] ?? ''), from: (f.attrs.from ?? []).map((x) => String(x).replace(/^"|"$/g, '')) }));
  // preconditions of an op on the state (std.tool.needs op= exists=<kind> absent=<kind> check=<custom> args=...)
  const opNeeds = new Map();
  for (const r of rowsOf(live, 'std.tool.needs')) {
    const list = opNeeds.get(first(r, 'op')) ?? [];
    for (const k of r.exists ?? []) list.push({ name: 'some', args: [], kinds: [String(k)] });
    for (const k of r.absent ?? []) list.push({ name: 'none', args: [], kinds: [String(k)] });
    for (const c of r.check ?? []) list.push({ name: String(c), args: (r.args ?? []).map(String) });
    opNeeds.set(first(r, 'op'), list);
  }
  const binds = (live?.ofType?.('std.tool.bind') ?? []).map((f, i) => {
    const r = rowsOf({ ofType: () => [f] }, 'x')[0];
    const args = (r.arg ?? []).map(parseArg);
    for (const a of argRows.filter((x) => x.bind === f.id)) args.push({ name: a.param, sources: a.from.flatMap((x) => x.split('|')).filter(Boolean) });
    const op = first(r, 'op');
    const effects = ops.get(op)?.effects ?? [];
    return { i, id: f.id, act: first(r, 'act'), of: (r.of ?? []).map(String), op, args, needs: [...(r.needs ?? []).map(parseCall), ...(opNeeds.get(op) ?? [])], makes: r.makes ?? (effects.includes('makes') ? ['thing'] : []), removes: r.removes ?? [], changes: r.changes ?? [] };
  });
  for (const b of binds) {
    if (!ops.has(b.op)) problems.push({ bind: b.i, why: `op ${b.op} is not declared`, code: 'no_op' });
    const ps = params.get(b.op) ?? new Map(), declared = new Set([...(ops.get(b.op)?.params ?? []), ...ps.keys()]);
    for (const a of b.args) {
      if (declared.size && !declared.has(a.name)) problems.push({ bind: b.i, why: `${b.op} has no parameter ${a.name}`, code: 'no_param' });
      for (const s of a.sources) {
        const head = s.split('.')[0];
        if (!TOOL_ARG_SOURCES.includes(head)) problems.push({ bind: b.i, why: `unknown source ${s}`, code: 'source' });
        if (head === 'custom' && customs.get(s.slice(7))?.kind !== 'search') problems.push({ bind: b.i, why: `${s.slice(7)} is not a declared search`, code: 'no_custom' });
      }
    }
    for (const n of b.needs) if (!BUILTIN_NEEDS.has(n.name) && n.name !== 'some' && n.name !== 'none' && customs.get(n.name)?.kind !== 'constraint') problems.push({ bind: b.i, why: `${n.name} is not a declared constraint`, code: 'no_custom' });
    for (const p of ps.values()) if (p.required && p.default === undefined && !b.args.some((a) => a.name === p.name)) problems.push({ bind: b.i, why: `${b.op} needs ${p.name} and the binding gives none`, code: 'required' });
  }
  return { ops, params, binds, customs, problems, catalog: [].concat(catalog ?? []) };
}

/** The binding of an act for a kind: the one whose `of` is nearest in the kind's lineage (a binding without `of` takes any kind). */
function pickBind(B, act, kind, ctx) {
  const line = kind === undefined ? [] : kindLineage(kind, ctx);
  let best = null, bestD = Infinity;
  for (const b of B.binds) {
    if (b.act !== act) continue;
    const d = b.of.length ? Math.min(...b.of.map((o) => { const i = line.indexOf(o); return i < 0 ? Infinity : i; })) : line.length + 1;
    if (d < bestD) { best = b; bestD = d; }
  }
  return best;
}

// ---- the view ----------------------------------------------------------------------------------------------------
/**
 * The tool's state as a Map(id -> { id, kind, attrs }): from an array of things (`{ id, kind, ...attrs }`), of facts
 * (`{ thing, attribute, value }`, `{ thing, relation, to }`), or a factsOf view; `view` may be a function giving one.
 */
export function readView(view) {
  const raw = typeof view === 'function' ? view() : view;
  const m = new Map();
  if (!raw) return m;
  if (typeof raw.ids === 'function' && typeof raw.thing === 'function') {
    for (const id of raw.ids()) { const t = raw.thing(id); const attrs = {}; for (const a of raw.attributes(id)) attrs[a.attribute] = a.value; for (const r of raw.relations(id)) attrs[r.relation] = r.to; m.set(id, { id, kind: t.kinds?.[0], attrs }); }
    return m;
  }
  const get = (id) => { const k = String(id); if (!m.has(k)) m.set(k, { id: k, kind: undefined, attrs: {} }); return m.get(k); };
  for (const f of [].concat(raw)) { // bounded: the facts given
    if (f.id !== undefined) { const { id, kind, ...attrs } = f; const t = get(id); if (kind !== undefined) t.kind = String(kind); for (const [k, v] of Object.entries(attrs)) if (v !== undefined) t.attrs[k] = v; }
    else if (f.thing !== undefined) { const t = get(f.thing); if (f.attribute === 'kind') t.kind ??= String(f.value); else if (f.attribute) t.attrs[f.attribute] = f.value; else if (f.relation) t.attrs[f.relation] = f.to; }
  }
  return m;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/**
 * What changed between two views: { added: [{ id, kind, attrs }], removed: [...], changed: [{ id, kind, key, from, to }] }.
 * By id; with `match: true` a thing removed and a thing added are also matched by identity of kind and values (the
 * pairs with the most values alike first; a reference to a thing of a pair counts as alike): a pair alike in every
 * value is no change; a pair that differs is `changed` (with `was`, the id it replaces). Only the keys in `keys` are
 * said (all keys when none is given), of a pair or of a thing that kept its id; the other differences (a place the
 * tool computed) are not said, unless nothing else changed. With `match` the
 * result also has `redone: [{ id, was, kind, keys }]` (every pair, with the keys it differs on) and `same` (true
 * only when the two views have the same things with the same values, ids aside: exact).
 */
export function stateDiff(before, after, { match = false, keys = null } = {}) {
  const B = before instanceof Map ? before : readView(before), A = after instanceof Map ? after : readView(after);
  const added = [], removed = [], changed = [];
  for (const [id, t] of A) if (!B.has(id)) added.push(t);
  for (const [id, t] of B) if (!A.has(id)) removed.push(t);
  for (const [id, t] of A) {
    const o = B.get(id);
    if (!o) continue;
    for (const k of new Set([...Object.keys(o.attrs), ...Object.keys(t.attrs)])) if (!same(o.attrs[k], t.attrs[k])) changed.push({ id, kind: t.kind, key: k, from: o.attrs[k], to: t.attrs[k] });
  }
  if (!match) return { added, removed, changed };
  const ids = new Set([...removed, ...added].map((t) => t.id)); // references to things of a pair are alike
  const val = (v) => (v !== undefined && v !== null && ids.has(String(v)) ? '#' : JSON.stringify(v ?? null));
  const differs = (r, a) => [...new Set([...Object.keys(r.attrs), ...Object.keys(a.attrs)])].filter((k) => val(r.attrs[k]) !== val(a.attrs[k]));
  const pairs = [];
  removed.forEach((r, i) => added.forEach((a, j) => { if (r.kind === a.kind) { const d = differs(r, a); pairs.push({ i, j, d, n: d.length }); } })); // bounded: removed x added
  pairs.sort((x, y) => x.n - y.n || x.j - y.j || x.i - y.i);
  const usedR = new Set(), usedA = new Set(), redone = [];
  for (const p of pairs) { if (usedR.has(p.i) || usedA.has(p.j)) continue; usedR.add(p.i); usedA.add(p.j); redone.push({ id: added[p.j].id, was: removed[p.i].id, kind: added[p.j].kind, keys: p.d, r: removed[p.i], a: added[p.j] }); }
  const keySet = keys ? new Set(typeof keys === 'string' ? [keys] : keys) : null;
  const said = [], unsaid = [];
  for (const x of changed) (keySet && !keySet.has(x.key) ? unsaid : said).push(x);
  for (const x of redone) for (const k of x.keys) (keySet && !keySet.has(k) ? unsaid : said).push({ id: x.id, was: x.was, kind: x.kind, key: k, from: x.r.attrs[k], to: x.a.attrs[k] });
  const out = { added: added.filter((_, j) => !usedA.has(j)), removed: removed.filter((_, i) => !usedR.has(i)), changed: said };
  if (!out.added.length && !out.removed.length && !out.changed.length) out.changed.push(...unsaid.map((x) => ({ ...x, unsaid: true }))); // nothing else changed: the differences are the change (marked `unsaid`: no key asked for changed)
  return { ...out, redone: redone.map(({ r, a, ...x }) => x), same: !out.added.length && !out.removed.length && !changed.length && redone.every((x) => !x.keys.length) };
}
const emptyDiff = () => ({ added: [], removed: [], changed: [] });
const isEmpty = (d) => !d.added.length && !d.removed.length && !d.changed.length;

/** The keys a plan sets (step arguments and the arguments of the calls); of a revision, those it sets otherwise than the plan it replaces: so a value the plan did not touch (a place the tool computed) is not said. */
function plannedKeys(oldEntry, plan, calls) {
  const skip = new Set(['kind', 'thing', 'in', 'a', 'b', 'n', 'ids', 'things']);
  const vals = (steps) => { const m = new Map(); for (const st of steps ?? []) for (const [k, v] of Object.entries(st.args ?? {})) if (!skip.has(k) && !(v && typeof v === 'object')) m.set(k, [...(m.get(k) ?? []), JSON.stringify(v)]); return m; };
  const callVals = (cs) => vals((cs ?? []).map((c) => ({ args: c.args })));
  const out = new Set();
  for (const [a, b] of [[vals(oldEntry?.plan?.steps), vals(plan?.steps)], [callVals(oldEntry?.calls), callVals(calls)]]) {
    for (const k of new Set([...a.keys(), ...b.keys()])) if (JSON.stringify([...new Set(a.get(k) ?? [])].sort()) !== JSON.stringify([...new Set(b.get(k) ?? [])].sort())) out.add(k);
  }
  return out;
}

/**
 * The tool's state as things of a fork of the live world (its declarations), so the planner's reasoning (induction,
 * places, deny rules, capacity) sees it: each thing of a declared kind, with the values its slots take. Returns the
 * fork and the things that could not be told ({ world, skipped }).
 */
export function mirrorState(live, view) {
  const w = live.fork();
  const c = live._compiled();
  const worldOf = new Map(rowsOf(live, 'std.schema.kind').map((k) => [first(k, 'of'), first(k, 'world')]));
  const skipped = [];
  for (const t of readView(view).values()) { // bounded: the things of the view
    const slots = c.slots.get(t.kind);
    if (!slots || !worldOf.has(t.kind)) { skipped.push(t.id); continue; }
    const attrs = Object.entries(t.attrs).filter(([k, v]) => slots.has(k) && k !== 'kind' && k !== 'world' && v !== undefined && v !== null && !slots.get(k).refs?.length);
    const id = /^[A-Za-z_][\w.-]*$/.test(t.id) && !w.has(t.id) ? t.id : null;
    if (!id) { skipped.push(t.id); continue; }
    const r = w.tell(`@${id} ${t.kind} kind=${quote(t.kind)} world=${quote(worldOf.get(t.kind))}${attrs.map(([k, v]) => ` ${k}=${typeof v === 'number' ? v : quote(v)}`).join('')}`);
    if (r?.ok === false) skipped.push(t.id);
  }
  return { world: w, skipped };
}

// ---- value translation ---------------------------------------------------------------------------------------------
const idKeyOf = (type, srcs) => {
  for (const s of srcs) { const sl = s?._compiled?.().slots.get(type); if (sl) for (const x of sl.values()) if (x.identity) return x.key; }
  return null;
};
/**
 * A value as a parameter takes it, translated by knowledge when the parameter does not accept it as said: a number
 * into its range; a kind to the nearest accepted kind of its lineage (what std.schema.drawn says it is drawn as, its
 * parents, then an accepted kind of which it is the parent); a grade to the nearest accepted grade of an ordered scale
 * (`scale=` or `type=`: rows with an order, named by `by=` or the type's id slot; ties in the order of `accepts`).
 * Returns { value, translated?: true, was?, by? } or { refused: true, values }.
 */
export function nearestAccepted(value, param, { live = null, catalog = [], look = null } = {}) {
  if (value === undefined || value === null || !param) return { value };
  if (Array.isArray(value)) return { value };
  const numeric = ['number', 'integer'].includes(param.kind) || ['number', 'integer'].includes(param.type);
  if (numeric || param.min !== undefined || param.max !== undefined) {
    let n = Number(value);
    if (Number.isNaN(n)) return numeric ? { refused: true, values: [] } : { value };
    if (param.type === 'integer' || param.kind === 'integer') n = Math.round(n);
    const c = Math.min(param.max ?? Infinity, Math.max(param.min ?? -Infinity, n));
    return c !== Number(value) ? { value: c, translated: true, was: value, by: 'range' } : { value: c };
  }
  const srcs = [live, ...[].concat(catalog ?? [])];
  const worldType = param.type && param.type !== 'kind' && live?._compiled?.().slots.get(param.type) && !rowsOf(srcs, param.type).some((r) => r.order !== undefined);
  if (worldType && !(param.accepts ?? []).length) { // type=<a kind of the world>: the value is that kind or one of its subkinds (or a thing of it, by id)
    const line = kindLineage(String(value), { live, catalog });
    if (line.includes(param.type)) return { value };
    const thing = typeof look === 'function' ? look().get(strip(value)) : null; // a thing of the tool's view
    if (thing && kindLineage(String(thing.kind ?? ''), { live, catalog }).includes(param.type)) return { value };
    return { refused: true, values: [param.type] };
  }
  const acc = param.accepts ?? [];
  if (!acc.length || acc.includes(String(value))) return { value };
  if (param.type === 'kind' || worldType) {
    const up = kindLineage(value, { live, catalog, drawn: true });
    const u = up.find((k) => acc.includes(k));
    if (u !== undefined) return { value: u, translated: true, was: value, by: up.indexOf(u) === 0 ? 'drawn' : 'lineage' };
    const d = acc.find((a) => kindLineage(a, { live, catalog }).includes(String(value)));
    if (d !== undefined) return { value: d, translated: true, was: value, by: 'lineage' };
    return { refused: true, values: acc };
  }
  const scale = param.scale ?? param.type;
  if (scale) {
    const rows = rowsOf(srcs, scale), by = param.by ?? idKeyOf(scale, srcs) ?? 'name', ok = param.order ?? 'order';
    const order = new Map(); for (const r of rows) if (first(r, by) !== undefined && !order.has(String(first(r, by)))) order.set(String(first(r, by)), Number(first(r, ok)));
    if (order.has(String(value))) {
      const at = order.get(String(value));
      let best = null;
      for (const a of acc) if (order.has(a) && (best === null || Math.abs(order.get(a) - at) < Math.abs(order.get(best) - at))) best = a;
      if (best !== null) return { value: best, translated: true, was: value, by: scale };
    }
  }
  return { refused: true, values: acc };
}

// ---- running a plan ------------------------------------------------------------------------------------------------
/** A new timeline: { done: [entries], undone: [entries] }; one entry per plan run (a revision replaces the last). */
export function toolTimeline() { return { done: [], undone: [] }; }

/**
 * Run a plan. With a World first (`runPlan(live, plan, { replace })`) the steps go through the world's own `act`
 * (runWorldPlan). Otherwise `runPlan(plan, bindings, primitives, opts)`: each step through the binding of its act and
 * kind (toolBindings), its arguments filled from the binding's sources (said, then revised, then the plan's values with
 * their provenance, then a conditional expectation `k.expect.when`), translated by knowledge (nearestAccepted), the
 * preconditions checked (`needs=`: exists(arg), absent(arg), a declared custom constraint), the primitive called, the
 * effect checked against the view (`makes=`, `removes=`, `changes=`). The plan is all or nothing: a step that fails
 * undoes the steps before it. `opts`: `view` (a function or the primitives' `view`), `timeline` (toolTimeline()),
 * `replace` (a revision: the last entry is undone and this plan takes its place), `request` (for provenance), `live`
 * and `catalog` (lineage, scales, expectations). A plan `{ act: 'undo' }` / `{ act: 'redo' }` moves the timeline; a
 * question (`question` set) is no step. Returns { ok, diff, replaced, calls, assumed, translated, failed?, result, step }.
 */
export function runPlan(a, b, c, d) {
  if (a && typeof a.act === 'function') return runWorldPlan(a, b, c);
  return runToolPlan(a, b, c, d);
}

function runToolPlan(plan, bindings, primitives = {}, opts = {}) {
  const { view = primitives?.view, timeline = null, replace = false, request = null, live = null, catalog = [] } = opts;
  const B = bindings ?? toolBindings(live, { catalog });
  const cat = [].concat(catalog ?? [], B.catalog ?? []);
  const ctx = { B, primitives, look: () => readView(view), live, catalog: cat, request, plan };
  const before = ctx.look();
  const base = { ok: false, diff: emptyDiff(), replaced: [], calls: [], assumed: [], translated: [], result: summary([], emptyDiff(), before), step: 'none' };
  if (!plan) return { ...base, failed: { code: 'no_plan', reply: 'why.none', roles: {} } };
  if (plan.act === 'undo' || plan.act === 'redo') return move(plan.act, timeline, ctx, before);
  if (plan.question) return { ...base, ok: true, question: plan.question };
  if (!plan.ok) return { ...base, failed: { code: 'plan', reply: null, roles: {}, because: [...(plan.cannot ?? []), ...(plan.notHonoured ?? [])] } };
  // a revision: the last entry is undone first and this plan takes its place
  let undone = null;
  if (replace && timeline?.done.length) {
    undone = undoEntry(timeline.done.at(-1), ctx);
    if (!undone.ok) return { ...base, failed: undone.failed };
  }
  const start = ctx.look();
  const snapshot = typeof primitives.snapshot === 'function' ? primitives.snapshot() : undefined;
  const ex = execute(plan.steps ?? [], ctx);
  if (!ex.ok) {
    rollback(start, snapshot, ctx);
    if (undone) redoEntry(timeline.done.at(-1), undone, ctx); // the entry the revision would have replaced stands again
    return { ...base, calls: ex.calls, assumed: ex.assumed, translated: ex.translated, failed: ex.failed };
  }
  const after = ctx.look();
  const entry = { plan, request, snapshot, after: typeof primitives.snapshot === 'function' ? primitives.snapshot() : undefined, diff: stateDiff(start, after), calls: ex.calls };
  const replacedEntry = undone ? timeline.done.at(-1) : null;
  if (timeline) { if (undone) timeline.done[timeline.done.length - 1] = entry; else timeline.done.push(entry); timeline.undone = []; }
  // the result as the net change: things removed and added again alike are matched (kind and values); of a revision,
  // only the keys its plan set otherwise are said
  const diff = stateDiff(before, after, { match: true, keys: plannedKeys(replacedEntry, plan, ex.calls) });
  unobserved(diff, plan, ex, before, after);
  // the key a change is said by: the request's key the binding took the value from (arg=end<-step.place: a move says the place)
  const said = new Map(); for (const c of ex.calls) for (const b of B.binds.filter((x) => x.op === c.op)) for (const a of b.args) { const st = a.sources.find((x) => x.startsWith('step.')); if (st) said.set(a.name, st.slice(5)); }
  for (const x of diff.changed) if (said.has(x.key) && said.get(x.key) !== x.key) x.as = said.get(x.key);
  // a revision whose net change has no thing added or removed and no key it set changed is no change ("nothing
  // changed"), whatever the tool recomputed alone (a place, an order)
  const same = !!undone && !diff.added.length && !diff.removed.length && diff.changed.every((x) => x.unsaid);
  if (same) diff.changed = [];
  return { ok: true, diff, same, replaced: undone ? undone.diff.removed.map((t) => t.id) : [], calls: ex.calls, assumed: ex.assumed, translated: ex.translated, result: summary(ex.ids, entry.diff, after, plan), step: undone ? 'replaced' : 'new', entry };
}

/**
 * A step on a thing that is there (a reference step) whose call the tool carried out, while the view shows no change
 * of the key the step set because the view cannot show that value (a move "up" inside the same region): the change
 * the call made is said from the step (`changed` with `by: 'call'`). When the view does show the value and it was so
 * already, nothing is added (that is no change).
 */
function unobserved(diff, plan, ex, before, after) {
  const seen = new Set(diff.changed.map((x) => `${x.id}|${x.key}`));
  (plan?.steps ?? []).forEach((st, i) => {
    const call = ex.calls.find((c) => c.steps.includes(i));
    if (st.args?.thing === undefined || st.item || !call) return;
    const id = strip(st.args.thing), b = before.get(id), a = after.get(id);
    if (!b || !a) return;
    for (const [key, v0] of Object.entries(st.args)) {
      const v = call.args[key] ?? v0; // the value as the tool took it (translated)
      if (['thing', 'kind'].includes(key) || v === undefined || v === null || typeof v === 'object' || seen.has(`${id}|${key}`)) continue;
      if (a.attrs[key] === undefined || String(a.attrs[key]) === String(v)) continue; // the view does not have the key, or shows the value: what it shows stands
      diff.changed.push({ id, kind: a.kind, key, from: b.attrs[key], to: v, by: 'call' });
      seen.add(`${id}|${key}`);
    }
  });
}

function summary(ids, diff, after, plan = null) {
  const kinds = {};
  const steps = plan?.steps ?? [];
  const items = steps.flatMap((s, i) => (s.item && ids[i] ? [ids[i]] : []));
  const itemSet = new Set(items);
  for (const t of diff.added) if (itemSet.has(t.id)) kinds[t.kind] = (kinds[t.kind] ?? 0) + 1; // the items, as the plan counts them
  const whole = steps[0] && !steps[0].item && !steps[0].link ? ids[0] ?? null : null;
  const acted = plan?.reference ? (plan.roles?.things ?? []).map(strip).filter((id) => after.has(id)) : []; // an act on things that are there: those things are its result
  return { things: diff.added.length ? diff.added.map((t) => t.id) : acted, items, count: items.length, kinds, whole, layout: plan?.roles?.layout ?? null, links: steps.filter((s, i) => s.link && ids[i]).length, present: after.size };
}

/** Run steps through their bindings; all or nothing is the caller's job. Returns { ok, ids, calls, assumed, translated, failed }. */
function execute(steps, ctx) {
  const { B } = ctx;
  const ids = new Array(steps.length).fill(null), calls = [], assumed = [], translated = [];
  const refs = steps.some((s) => Object.values(s.args ?? {}).some((v) => v && typeof v === 'object' && 'step' in v));
  const resolveV = (v) => (v && typeof v === 'object' && 'step' in v ? ids[v.step] : typeof v === 'string' && v.startsWith('$') ? strip(v) : v);
  // the binding of each step
  const view0 = ctx.look();
  const plan = steps.map((s) => {
    const thing = s.args?.thing !== undefined ? strip(s.args.thing) : null;
    const kind = s.args?.kind ?? (thing ? view0.get(thing)?.kind : undefined);
    return { s, kind, bind: pickBind(B, s.action, kind, ctx) };
  });
  const miss = plan.find((p) => !p.bind);
  if (miss) return { ok: false, ids, calls, assumed, translated, failed: { code: 'no_binding', reply: 'refused.not_allowed', roles: { kind: miss.kind ?? miss.s.action }, step: miss.s } };
  // groups: steps of one binding with the same arguments, when the binding counts them (step.count) or lists them (step.things)
  const groups = [];
  const counts = (b) => b.args.some((a) => a.sources.some((x) => x === 'step.count' || x === 'step.things'));
  const keyOf = (p) => JSON.stringify([p.bind.i, p.s.action, p.kind, Object.entries(p.s.args ?? {}).filter(([k]) => k !== 'thing').sort()]);
  plan.forEach((p, i) => {
    const g = counts(p.bind) && groups.find((x) => x.key === keyOf(p) && (!refs || x.last === i - 1));
    if (g) { g.idx.push(i); g.last = i; } else groups.push({ key: keyOf(p), idx: [i], last: i, bind: p.bind, kind: p.kind });
  });
  for (const g of groups) { // bounded: the groups of the plan
    const steps1 = g.idx.map((i) => steps[i]);
    const filled = fillArgs(g.bind, g.kind, steps1, resolveV, ctx);
    if (filled.failed) return { ok: false, ids, calls, assumed, translated, failed: { ...filled.failed, step: steps1[0] } };
    for (const a of filled.assumed) if (!assumed.some((x) => x.key === a.key && same(x.value, a.value))) assumed.push(a);
    translated.push(...filled.translated);
    const viewB = ctx.look();
    const unmet = needsUnmet(g.bind, filled.args, g.kind, viewB, ctx);
    if (unmet) return { ok: false, ids, calls, assumed, translated, failed: { ...unmet, step: steps1[0] } };
    const fn = ctx.primitives?.[g.bind.op];
    if (typeof fn !== 'function') return { ok: false, ids, calls, assumed, translated, failed: { code: 'no_primitive', reply: 'refused.not_allowed', roles: { kind: g.kind ?? g.bind.act }, op: g.bind.op } };
    let r;
    try { r = fn(filled.args); } catch (e) { return { ok: false, ids, calls, assumed, translated, failed: { code: 'tool_error', reply: 'why.nothing', roles: {}, op: g.bind.op, detail: String(e?.message ?? e) } }; }
    calls.push({ op: g.bind.op, args: filled.args, steps: g.idx });
    if (r === false || (r && typeof r === 'object' && r.ok === false)) return { ok: false, ids, calls, assumed, translated, failed: { code: r?.code ?? 'tool_refused', reply: r?.reply ?? 'why.nothing', roles: r?.roles ?? {}, op: g.bind.op } };
    const viewA = ctx.look(), d = stateDiff(viewB, viewA);
    const effect = effectUnmet(g.bind, filled.args, g.kind, d, viewA);
    if (effect) return { ok: false, ids, calls, assumed, translated, failed: { ...effect, op: g.bind.op } };
    // what each step made: the things added, in order, one per step of the group
    const made = d.added.map((t) => t.id);
    g.idx.forEach((i, k) => { ids[i] = made[k] ?? (steps[i].args?.thing !== undefined ? strip(steps[i].args.thing) : null); });
  }
  return { ok: true, ids, calls, assumed, translated };
}

const SAID = new Set(['said']);
/** The provenance of a plan value: its assumption's source, else 'revised' when the request has it from a reaction, else 'said'. */
function provenance(key, ctx) {
  const pk = key === 'kind' ? 'kinds' : key;
  const a = ctx.plan?.assumed?.find((x) => x.key === pk || x.key === key);
  if (a) return { from: a.from, because: a.because };
  const c = ctx.request?.constraints?.find((x) => x.on === key || x.attribute === key || (key === 'n' && x.on === 'count'));
  return { from: c && c.origin && !SAID.has(c.origin) ? 'revised' : 'said' };
}

function sourceValue(src, name, kind, steps1, args, resolveV, ctx) {
  const [head, ...rest] = src.split('.');
  const path = rest.join('.');
  if (head === 'step') {
    if (path === 'count') return { value: steps1.length, ...provenance('count', ctx), plan: true };
    if (path === 'things') return { value: steps1.map((s) => resolveV(s.args?.thing)).filter((x) => x !== undefined && x !== null), from: 'said' };
    const v = resolveV(steps1[0].args?.[path]);
    return v === undefined ? null : { value: v, ...provenance(path, ctx), plan: true }; // the plan's own value: its assumption is the plan's
  }
  if (head === 'request') {
    const [on, attr] = rest;
    const c = (ctx.request?.constraints ?? []).find((x) => x.on === on && (x.want ?? 'yes') === 'yes' && (!attr || x.attribute === attr));
    if (!c) return null;
    const v = c.value ?? c.number;
    return v === undefined || v === null ? null : { value: v, from: c.origin && !SAID.has(c.origin) ? 'revised' : 'said' };
  }
  if (head === 'result') { const v = resolveV({ step: Number(path) }); return v === undefined || v === null ? null : { value: v, from: 'said', plan: true }; }
  if (head === 'state') { // the thing of that kind the request refers to (a constraint naming the kind), else the newest one there
    const things = [...ctx.look().values()].filter((t) => kindLineage(t.kind, ctx).includes(path));
    if (!things.length) return null;
    const named = (ctx.request?.constraints ?? []).find((c) => c.value && things.some((t) => t.id === strip(c.value)));
    return { value: named ? strip(named.value) : things.at(-1).id, from: named ? 'said' : 'world' };
  }
  if (head === 'plan') { const v = ctx.plan?.roles?.[path]; return v === undefined ? null : { value: v, ...provenance(path, ctx), plan: true }; }
  if (head === 'value') return { value: path, from: 'world', plan: true }; // a constant of the wires: not an assumption
  if (head === 'custom') {
    const fn = ctx.primitives?.[path];
    if (typeof fn !== 'function') return null;
    const v = fn({ kind, ...args }, [...ctx.look().values()]);
    return v === undefined || v === null ? null : { value: v, from: 'custom', because: [path] };
  }
  if (head === 'expect') { const e = expectedValue(kind, name, { ...steps1[0].args, ...args }, { live: ctx.live, catalog: ctx.catalog }); return e?.value === undefined ? null : { value: e.value, from: e.from, because: e.because }; }
  return null;
}

function fillArgs(bind, kind, steps1, resolveV, ctx) {
  const params = ctx.B.params.get(bind.op) ?? new Map();
  const args = {}, assumed = [], translated = [];
  const declared = [...bind.args, ...[...params.values()].filter((p) => p.default !== undefined && !bind.args.some((a) => a.name === p.name)).map((p) => ({ name: p.name, sources: [] }))]; // a parameter the binding leaves out takes its declared default
  for (const a of declared) { // bounded: the arguments of one binding
    let got = null;
    const changed = bind.changes.includes(a.name); // a value a change sets is said or planned, never expected: an expectation would change what was not asked
    for (const s of changed ? a.sources : [...a.sources, 'expect']) { got = sourceValue(s, a.name, kind, steps1, args, resolveV, ctx); if (got) break; } // an expectation is always the last source
    const p = params.get(a.name);
    if (changed && !got) continue;
    if (!got && p?.default !== undefined) got = { value: p.default, from: 'default', because: [`${bind.op}.${a.name} default`] }; // the parameter's own default, declared: the weakest source
    if (!got) { if (p?.required) return { failed: { code: 'missing', reply: 'refused.missing_value', roles: { key: a.name } } }; continue; }
    const t = nearestAccepted(got.value, p, ctx);
    if (t.refused) return { failed: { code: 'value', reply: 'refused.value', roles: { key: a.name, value: String(got.value), values: (t.values ?? []).join(', ') } } };
    args[a.name] = p?.names?.has(String(t.value)) ? p.names.get(String(t.value)) : t.value; // the tool's own name for it, when declared
    if (t.translated) translated.push({ key: a.name, was: t.was, value: t.value, by: t.by });
    const shown = got.from === 'custom' && typeof t.value === 'string' ? ctx.look().get(strip(t.value)) : null; // a thing of the view is said by its kind
    if (t.translated || (got.from !== 'said' && !got.plan)) assumed.push({ key: a.name, value: shown?.kind !== undefined ? plainKind(shown.kind) : t.value, ...(shown ? { thing: shown.id } : {}), from: t.translated ? 'translated' : got.from, ...(t.translated ? { was: t.was, by: t.by } : {}), ...(got.because?.length ? { because: [].concat(got.because).join(', ') } : {}), op: bind.op });
  }
  return { args, assumed, translated };
}

function needsUnmet(bind, args, kind, view, ctx) {
  for (const n of bind.needs) {
    const vals = n.args.map((x) => args[x]);
    if (n.name === 'exists' || n.name === 'absent') {
      const ids = vals.flatMap((v) => [].concat(v ?? [])).map(strip);
      const bad = ids.find((id) => (n.name === 'exists') !== view.has(id));
      if (bad !== undefined) return { code: n.name === 'exists' ? 'no_such' : 'exists', reply: n.name === 'exists' ? 'refused.no_such' : 'why.nothing', roles: { thing: bad } };
      continue;
    }
    if (n.name === 'some' || n.name === 'none') { // a thing of the kind (by lineage) is in the state, or none is
      const has = [...view.values()].some((t) => kindLineage(t.kind, ctx).some((k) => n.kinds.includes(k)));
      if (has !== (n.name === 'some')) return { code: n.name === 'some' ? 'no_such' : 'exists', reply: n.name === 'some' ? 'refused.no_such' : 'why.nothing', roles: { thing: n.kinds[0] } };
      continue;
    }
    const custom = ctx.B.customs.get(n.name), fn = ctx.primitives?.[n.name];
    if (typeof fn !== 'function') return { code: 'no_primitive', reply: 'refused.not_allowed', roles: { kind: kind ?? bind.act }, op: n.name };
    const r = fn(Object.fromEntries(n.args.map((x) => [x, args[x]])), [...view.values()]);
    if (r !== true) return { code: n.name, reply: custom?.fails ?? 'why.nothing', roles: { kind: kind ?? '', ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])) } };
  }
  return null;
}

function effectUnmet(bind, args, kind, d, view) {
  if (bind.makes.length && !d.added.length) return { code: 'no_effect', reply: 'why.nothing', roles: { kind } };
  for (const r of bind.removes) { const gone = new Set(d.removed.map((t) => t.id)); const want = [].concat(args[r] ?? []).map(strip); if (want.some((id) => !gone.has(id))) return { code: 'no_effect', reply: 'why.nothing', roles: { kind } }; }
  if (bind.changes.length && !d.changed.some((x) => bind.changes.includes(x.key))) {
    const things = [].concat(args.ids ?? args.thing ?? []).map(strip);
    const already = things.length && bind.changes.every((k) => args[k] === undefined || things.every((id) => String(view.get(id)?.attrs[k]) === String(args[k])));
    return already ? { code: 'same', reply: 'nothing.same', roles: { kind } } : { code: 'no_effect', reply: 'why.nothing', roles: { kind } }; // asked for what is there already
  }
  return null;
}

// ---- the timeline: undo by the tool's snapshot, else by the inverse of the diff through the bindings ---------------
/** The steps that take a diff back: remove what was added, make again what was removed, set back what changed (a key no change binding takes, such as a place the tool computes, comes back with the rest). */
function inverseSteps(diff, ctx) {
  const settable = (x) => { const b = ctx ? pickBind(ctx.B, 'change', x.kind, ctx) : null; return !b || b.args.some((a) => a.name === x.key || a.sources.includes(`step.${x.key}`)); };
  return [
    ...diff.added.map((t) => ({ action: 'remove', args: { thing: t.id, kind: t.kind } })),
    ...diff.removed.map((t) => ({ action: 'make', args: { kind: t.kind, ...t.attrs }, item: true })),
    ...diff.changed.filter(settable).map((x) => ({ action: 'change', args: { thing: x.id, kind: x.kind, [x.key]: x.from } })),
  ];
}
function undoEntry(entry, ctx) {
  const before = ctx.look();
  if (entry.snapshot !== undefined && typeof ctx.primitives.restore === 'function') { ctx.primitives.restore(entry.snapshot); return { ok: true, diff: stateDiff(before, ctx.look()) }; }
  const ex = execute(inverseSteps(entry.diff, ctx), { ...ctx, plan: null, request: null });
  if (!ex.ok) { rollback(before, undefined, ctx); return { ok: false, failed: { ...ex.failed, code: `undo_${ex.failed.code}` } }; }
  return { ok: true, diff: stateDiff(before, ctx.look()) };
}
function redoEntry(entry, undone, ctx) {
  const before = ctx.look();
  if (entry.after !== undefined && typeof ctx.primitives.restore === 'function') { ctx.primitives.restore(entry.after); return { ok: true, diff: stateDiff(before, ctx.look()) }; }
  const ex = execute(inverseSteps(undone.diff, ctx), { ...ctx, plan: null, request: null });
  if (!ex.ok) { rollback(before, undefined, ctx); return { ok: false, failed: { ...ex.failed, code: `redo_${ex.failed.code}` } }; }
  return { ok: true, diff: stateDiff(before, ctx.look()) };
}
function rollback(start, snapshot, ctx) {
  if (snapshot !== undefined && typeof ctx.primitives.restore === 'function') { ctx.primitives.restore(snapshot); return; }
  const d = stateDiff(start, ctx.look());
  if (!isEmpty(d)) execute(inverseSteps(d, ctx), { ...ctx, plan: null, request: null });
}
function move(act, timeline, ctx, before) {
  const out = { ok: false, [act]: true, diff: emptyDiff(), replaced: [], calls: [], assumed: [], translated: [], step: act, result: summary([], emptyDiff(), before) };
  if (!timeline) return { ...out, failed: { code: 'no_timeline', reply: `nothing.${act}`, roles: {} } };
  if (act === 'undo') {
    const e = timeline.done.at(-1);
    if (!e) return { ...out, failed: { code: 'empty', reply: 'nothing.undo', roles: {} } };
    const u = undoEntry(e, ctx);
    if (!u.ok) return { ...out, failed: u.failed };
    timeline.done.pop(); timeline.undone.push({ ...e, undoneBy: u.diff });
    return { ...out, ok: true, diff: u.diff, entry: e };
  }
  const e = timeline.undone.at(-1);
  if (!e) return { ...out, failed: { code: 'empty', reply: 'nothing.redo', roles: {} } };
  const r = redoEntry(e, { diff: e.undoneBy }, ctx);
  if (!r.ok) return { ...out, failed: r.failed };
  timeline.undone.pop(); timeline.done.push({ ...e, diff: stateDiff(before, ctx.look()) });
  return { ...out, ok: true, diff: r.diff, entry: e };
}

// ---- what this world can do, from its declarations and its bindings ------------------------------------------------
/** The acts a tool world offers: those it honours (std.schema.honours) and binds (std.tool.bind): [{ act, kinds, on, op }] (kinds: the declared kinds of the act its bindings cover; on: the constraints it honours). */
export function toolCapabilities(live, bindings = null) {
  const B = bindings ?? toolBindings(live);
  const cap = capabilitiesOf(live);
  const out = [];
  for (const b of B.binds) {
    const kinds = [...cap.kinds.entries()].filter(([k, acts]) => acts.has(b.act) && (!b.of.length || kindLineage(k, { live }).some((x) => b.of.includes(x)))).map(([k]) => k);
    const on = [...new Set(cap.honours.filter((h) => h.act === b.act && (!h.of.length || !b.of.length || h.of.some((o) => b.of.includes(o) || kinds.includes(o)))).flatMap((h) => [...h.on]))];
    const e = out.find((x) => x.act === b.act);
    if (e) { for (const k of kinds) if (!e.kinds.includes(k)) e.kinds.push(k); for (const o of on) if (!e.on.includes(o)) e.on.push(o); }
    else out.push({ act: b.act, kinds, on, op: b.op });
  }
  return out.filter((x) => x.kinds.length && cap.honours.some((h) => h.act === x.act)); // an act is offered when it is honoured and bound
}

/** The questions the door answers by saying facts of the live world: its declarations (capabilities) and its state. */
export const WORLD_QUESTIONS = Object.freeze(['capabilities', 'state']);
/**
 * Facts of the live world for a question, as reply facts: `capabilities` from the declarations and bindings
 * (toolCapabilities), `state` from the view: the things of the kinds the request names (by lineage), else all, counted
 * per kind (`state.count` { kind, number }; `state.empty` when there is nothing). Returns { facts, capabilities }.
 */
export function askWorld(question, request, { live, bindings = null, view = null, catalog = [] } = {}) {
  if (question === 'capabilities') return { capabilities: toolCapabilities(live, bindings), facts: [] };
  const things = [...readView(view).values()];
  // the kinds asked about: the kinds wanted, the kinds a count is of, else every kind word said (a unit such as "nodes"
  // too); a whole or a link is counted only when its kind is said
  let kinds = (request?.constraints ?? []).filter((c) => (c.on === 'kind' && (c.want ?? 'yes') === 'yes' && c.value) || (c.on === 'count' && c.of)).map((c) => c.value ?? c.of);
  if (!kinds.length) kinds = (request?.mentions ?? []).filter((m) => !m.none).map((m) => m.kind); // a word for the world itself that is no kind counts everything
  kinds = [...new Set(kinds)];
  const facts = [];
  if (kinds.length) for (const k of kinds) facts.push({ reply: 'state.count', roles: { kind: k, number: things.filter((t) => kindLineage(t.kind, { live, catalog }).includes(k)).length } });
  else { const m = new Map(); for (const t of things) m.set(t.kind, (m.get(t.kind) ?? 0) + 1); for (const [kind, number] of m) facts.push({ reply: 'state.count', roles: { kind, number } }); if (!m.size) facts.push({ reply: 'state.empty', roles: {} }); }
  return { facts };
}

// ---- the door: one session over any tool world ---------------------------------------------------------------------
/**
 * A session over a live world with a tool: read, revise, plan, run, say, with no code per world. `live`: the world's
 * declarations (kinds, honours, std.tool.*, its own expectations); `primitives`: the tool's operations by op name, its
 * custom constraints and searches, `view()` (its state as facts) and, when it has them, `snapshot()` / `restore(s)`.
 * `opts`: `language` (w.lang.en cues and replies), `catalog` (k.expect, k.actions, scales), `revisions`, `lang`, `seed`,
 * `mirror` (default true: the state is told into a fork of the declarations for the planner's reasoning). A question
 * about what the world can do (a reaction `capabilities` of the language world) is answered from the bindings; undo and
 * redo (the acts) move the timeline. Returns { say(text) -> { request, revision, plan, run, reply }, timeline,
 * dialogue, bindings }.
 */
export function toolSession(live, primitives, { language = null, catalog = [], revisions = null, lang = undefined, seed = 1, mirror = true, bindings = null } = {}) {
  const cat = [].concat(catalog ?? []);
  const B = bindings ?? toolBindings(live, { catalog: cat });
  const timeline = toolTimeline();
  const dialogue = { last: null, result: null, previous: null, seed, corrections: [], lastPlan: null, lastRun: null };
  const view = primitives.view;
  const runOpts = { view, timeline, live, catalog: cat };
  const sayOpts = { language, ...(lang ? { lang } : {}) };
  const fromTimeline = () => { // the dialogue follows the timeline: its last entry is the last request
    const e = timeline.done.at(-1), p = timeline.done.at(-2);
    Object.assign(dialogue, { last: e?.request ?? null, result: e?.result ?? null, lastPlan: e?.plan ?? null, seed: e?.seed ?? seed, previous: p?.request ?? null, previousSeed: p?.seed ?? seed, lastRun: e ? { made: e.result?.things ?? [] } : null });
  };
  return {
    timeline, dialogue, bindings: B,
    say(text) {
      const state = mirror ? mirrorState(live, view).world : live; // the state as things: names are read from it, plans reason on it
      const request = readRequest(live, text, { language: language ?? live, catalog: cat, dialogue, state, ...(lang ? { lang } : {}) });
      const question = WORLD_QUESTIONS.find((q) => request.reactions.some((r) => r.value === q));
      if (question) { // a question is no step: facts of the live world, said by reply facts
        const run = runPlan({ act: 'ask', question, ok: true, steps: [] }, B, primitives, runOpts);
        const answer = askWorld(question, request, { live, bindings: B, view, catalog: cat });
        return { request, revision: null, plan: null, run, reply: sayRequest(request, { run, capabilities: answer.capabilities, answer: answer.facts }, sayOpts) };
      }
      const rev = request.act === 'undo' || request.act === 'redo' ? { undo: request.act === 'undo', redo: request.act === 'redo', request: null } : reviseRequest(dialogue, request, { revisions: revisions ?? language, catalog: cat, live: state });
      if (rev.undo || rev.redo) {
        const run = runPlan({ act: rev.redo ? 'redo' : 'undo' }, B, primitives, runOpts);
        fromTimeline();
        return { request, revision: rev, plan: null, run, reply: sayRequest(request, { run, reply: rev.reply }, sayOpts) };
      }
      if (!rev.request) return { request, revision: rev, plan: null, run: null, reply: sayRequest(request, { reply: rev.reply }, sayOpts) };
      if (request.unread?.length && !request.reactions?.length) { // a message read only in part executes nothing
        const run = runPlan(null, B, primitives, runOpts);
        return { request: rev.request, revision: rev, plan: null, run, reply: sayRequest(rev.request, { run: { ...run, failed: { code: 'unread', reply: 'not_understood', roles: { words: request.unread.join(', ') } } } }, sayOpts) };
      }
      const replace = rev.sort === 'reaction' && !!rev.replace && timeline.done.length > 0;
      const plan = planRequest(state, rev.request, { catalog: cat, dialogue, seed: rev.seed, vary: rev.vary, replace: replace ? timeline.done.at(-1).diff.added.map((t) => t.id) : [] });
      const run = runPlan(plan, B, primitives, { ...runOpts, replace, request: rev.request });
      if (run.ok) {
        Object.assign(run.entry, { result: run.result, seed: rev.seed });
        const step = rev.does?.find((x) => x.does === 'step');
        if (step) dialogue.corrections.push({ on: step.on, step: step.direction });
        fromTimeline();
        dialogue.vary = !!rev.vary;
      }
      const reply = sayRequest(rev.request, { ...plan, run, revised: rev.sort === 'reaction' && run.ok && !run.same, reply: rev.reply }, sayOpts);
      return { request: rev.request, revision: rev, plan, run, reply };
    },
  };
}
