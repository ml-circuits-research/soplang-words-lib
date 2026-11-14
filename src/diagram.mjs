// Diagrams composed from knowledge (reviewer 04:40, 05:45). A diagram kind (`k.diagrams.kind name= form=
// structure= layout= edges= role=...`) says what structure it shows and how it is laid out; its fills
// (`k.diagrams.fill kind= type= key= gives=edges|order|members|values topic=`) say which knowledge has that
// structure: the facts of `type`, the ones about the topic through the key `topic=`, read along `key`. A
// kind × a topic whose knowledge has the structure gives nodes, edges and groups as w.diagram wires
// (`w.diagram.diagram`, `.node`, `.edge`, `.group`), laid out by the kind's layout with `arrange`, and
// shaped by `k.diagrams.shape kind= role= shape=`. With no knowledge of that structure for the topic it
// says so, never a placeholder.

import { arrange } from './space.mjs';

const bare = (v) => String(v ?? '').replace(/^"|"$/g, '').replace(/^\$/, '');
const low = (v) => bare(v).toLowerCase();
const val = (v) => (typeof v === 'number' ? String(v) : /^[A-Za-z_][\w.:-]*$/.test(String(v)) ? String(v) : JSON.stringify(String(v)));
const FORWARD = new Set(['next', 'then', 'to', 'leads_to', 'before']); // keys whose value comes after the fact
const rnd = (seed) => { let x = seed >>> 0 || 1; return () => { x = (x * 1103515245 + 12345) >>> 0; return x / 4294967296; }; };

/** The diagram kinds a world holds: [{ name, form, layout: [], edges, roles: [], fills: [] }]. */
export function diagramKinds(world) {
  const fills = world.ofType('k.diagrams.fill').map((f) => ({ kind: bare(f.attrs.kind[0]), type: bare(f.attrs.type[0]), key: bare(f.attrs.key[0]), gives: bare(f.attrs.gives[0]), topic: f.attrs.topic ? bare(f.attrs.topic[0]) : null }));
  return world.ofType('k.diagrams.kind').map((k) => {
    const name = bare(k.attrs.name[0]);
    return { name, form: bare(k.attrs.form[0]), layout: (k.attrs.layout || []).map(bare), edges: bare(k.attrs.edges?.[0] ?? 'none'), roles: (k.attrs.role || []).map(bare), fills: fills.filter((f) => f.kind === name) };
  });
}

function kindOf(world, kind) {
  const ks = diagramKinds(world), k = low(kind);
  return ks.find((x) => low(x.name) === k) ?? ks.find((x) => x.form === k) ?? ks.find((x) => low(x.name).replace(/ diagram$/, '') === k) ?? null;
}

// the facts of a fill about a topic: a value of the topic key equal to the topic, else containing it as words
function about(world, fill, topic) {
  const facts = world.ofType(fill.type);
  if (!fill.topic) return facts;
  const t = low(topic), has = (f) => (f.attrs[fill.topic] || []).map(low);
  const exact = facts.filter((f) => has(f).includes(t));
  return exact.length ? exact : facts.filter((f) => has(f).some((v) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(v)));
}

// nodes and edges from one fill: { nodes: [label], edges: [[from, to]], groups: Map(group -> [labels]), root }
function structureOf(world, fill, topic, { max = 12 } = {}) {
  const short = (t) => { const c = bare(t).split(/[,;:(]/)[0].trim().split(/\s+/); return c.length > 6 ? `${c.slice(0, 6).join(' ')}…` : c.join(' '); };
  const name = (f) => bare(f.attrs.name?.[0] ?? f.attrs.label?.[0] ?? (f.attrs.about ? short(f.attrs.about[0]) : f.id)); // a step with no name is said by its first words
  const nodes = [], edges = [], groups = new Map(), seen = new Set();
  const add = (x) => { if (!seen.has(x) && nodes.length < max) { seen.add(x); nodes.push(x); } return seen.has(x); };
  const facts = about(world, fill, topic);
  if (fill.gives === 'order') {
    const sorted = facts.filter((f) => f.attrs[fill.key]).sort((a, b) => Number(bare(a.attrs[fill.key][0])) - Number(bare(b.attrs[fill.key][0])));
    for (const f of sorted) add(name(f));
    for (let i = 1; i < nodes.length; i++) edges.push([nodes[i - 1], nodes[i]]);
    return { nodes, edges, groups, root: null, ordered: true };
  }
  if (fill.gives === 'members') { // groups: the kinds under the topic, each with its members
    const under = (x) => world.ofType(fill.type).filter((f) => (f.attrs[fill.key] || []).map(low).includes(low(x))).map(name);
    for (const g of under(topic)) { const ms = under(g); if (!ms.length) continue; groups.set(g, ms.slice(0, 4)); for (const m of ms.slice(0, 4)) add(m); if (groups.size >= 3) break; }
    return { nodes, edges, groups, root: topic };
  }
  if (fill.gives === 'values') {
    add(bare(topic));
    for (const f of facts.slice(0, max - 1)) { const v = bare(f.attrs[fill.key]?.[0] ?? ''); if (v && add(v)) edges.push([bare(topic), v]); }
    return { nodes, edges, groups, root: bare(topic) };
  }
  // gives=edges
  if (fill.topic && fill.topic === fill.key) { // the topic is a value of the key: the things under it, breadth first (a tree of kinds)
    add(bare(topic));
    const queue = [bare(topic)];
    while (queue.length && nodes.length < max) { // bounded: at most max nodes, each queued once
      const top = queue.shift();
      for (const f of world.ofType(fill.type).filter((x) => (x.attrs[fill.key] || []).map(low).includes(low(top)))) { const c = name(f); if (seen.has(c)) continue; if (!add(c)) break; edges.push([top, c]); queue.push(c); }
    }
    return { nodes, edges, groups, root: bare(topic) };
  }
  if (fill.topic === 'name' || !fill.topic) { // the topic's own fact: an edge to each value of the key (its parts, its neighbours), and among those
    const own = world.ofType(fill.type).find((f) => low(name(f)) === low(topic));
    if (!own) return { nodes, edges, groups, root: null };
    const t = name(own); add(t);
    for (const v of (own.attrs[fill.key] || []).map(bare)) if (add(v)) edges.push([t, v]);
    if (!fill.topic) for (const f of world.ofType(fill.type).filter((x) => seen.has(name(x)) && name(x) !== t)) for (const v of (f.attrs[fill.key] || []).map(bare)) if (seen.has(v) && v !== t && !edges.some(([a, b]) => (a === v && b === name(f)))) edges.push([name(f), v]);
    return { nodes, edges, groups, root: t };
  }
  // the facts about the topic are the nodes; the key joins them (by name, or by their number: after=1)
  const byN = new Map(facts.map((f) => [bare(f.attrs.n?.[0] ?? ''), name(f)]));
  const root = facts.some((f) => (f.attrs[fill.key] || []).map(low).includes(low(topic))) ? bare(topic) : null;
  if (root) add(root);
  for (const f of facts) add(name(f));
  for (const f of facts) for (const v of (f.attrs[fill.key] || []).map(bare)) {
    const other = seen.has(v) ? v : byN.get(v);
    if (other && seen.has(name(f))) edges.push(root && other === root ? [root, name(f)] : FORWARD.has(fill.key) ? [name(f), other] : [other, name(f)]); // next= points on; after= points back
  }
  return { nodes, edges, groups, root };
}

/**
 * A diagram of a kind about a topic, from knowledge: { kind, topic, fill, text (w.diagram wires), nodes:
 * [{ id, label, role, shape, x, y }], edges: [{ from, to }], groups: [{ id, label, members }] } or { why }
 * when no fill of the kind has that structure for the topic. Options: `seed` (which fill, when several
 * fit), `max` (nodes, 12), `id` (the diagram's id, 'd1'), `frame` (for arrange), `into` (a world the
 * wires are told into), `layout` (a w.diagram layout asked for, instead of the kind's first).
 */
export function composeDiagram(world, { kind, topic, seed = 1, max = 12, id = 'd1', frame = { x: 0, y: 0, w: 100, h: 100 }, into, layout: asked } = {}) {
  const k = kindOf(world, kind);
  if (!k) return { why: `no diagram kind ${kind} in k.diagrams` };
  if (!k.fills.length) return { why: `nothing in k.diagrams says which knowledge fills a ${k.name}` };
  const tried = [];
  const order = k.fills.map((f, i) => [f, rnd(seed + i)()]).sort((a, b) => a[1] - b[1]).map(([f]) => f);
  let s = null, fill = null;
  for (const f of order) {
    const r = structureOf(world, f, topic, { max });
    tried.push(`${f.type}.${f.key}`);
    if (r.nodes.length >= 2 || r.groups.size >= 2) { s = r; fill = f; break; }
  }
  if (!s) return { why: `no knowledge of the structure of a ${k.name} about ${topic} (tried ${tried.join(', ')})` };
  if (k.form === 'cycle' && s.nodes.length > 2 && s.ordered) s.edges.push([s.nodes[s.nodes.length - 1], s.nodes[0]]);
  const roleOf = (label, i, n) => {
    const R = new Set(k.roles);
    if (R.has('root') && label === s.root) return 'root';
    if (R.has('centre') && label === s.root) return 'centre';
    if (R.has('start') && i === 0) return 'start';
    if (R.has('end') && i === n - 1 && n > 1) return 'end';
    for (const r of ['process', 'stage', 'event', 'item', 'branch', 'post', 'node']) if (R.has(r)) return r;
    return k.roles[0];
  };
  const shapes = new Map(world.ofType('k.diagrams.shape').filter((x) => low(x.attrs.kind[0]) === low(k.name)).map((x) => [bare(x.attrs.role[0]), bare(x.attrs.shape[0])]));
  const ids = new Map(s.nodes.map((l, i) => [l, `${id}.n${i + 1}`]));
  const layout = asked ?? k.layout[0] ?? 'free'; // an arrangement request (arrangementOf(...).diagramLayout) over the kind's own
  const E = s.edges.map(([a, b]) => [ids.get(a), ids.get(b)]).filter(([a, b]) => a && b);
  const boxes = s.nodes.map((l) => ({ id: ids.get(l), w: Math.min(30, 6 + l.length * 1.6), h: 8 }));
  let at;
  if (layout === 'top_down') at = arrange(boxes, E.length ? 'layers' : 'column', { edges: E, frame, direction: 'down' });
  else if (layout === 'left_right') at = arrange(boxes, E.length && !s.ordered ? 'layers' : 'row', { edges: E, frame });
  else if (layout === 'circular') at = arrange(boxes, 'circle', { frame });
  else if (layout === 'radial' && s.root && ids.has(s.root)) {
    at = arrange(boxes.filter((b) => b.id !== ids.get(s.root)), 'circle', { frame });
    const c = boxes.find((b) => b.id === ids.get(s.root)); at.set(c.id, { x: frame.x + frame.w / 2 - c.w / 2, y: frame.y + frame.h / 2 - c.h / 2, w: c.w, h: c.h });
  } else if (layout === 'overlapping' && s.groups.size) { // each group a circle, the circles overlapping in a ring; members inside their circle
    at = new Map();
    const gs = [...s.groups.keys()], ring = arrange(gs.map((g) => ({ id: g, w: 44, h: 44 })), 'circle', { frame: { x: frame.x + 8, y: frame.y + 8, w: frame.w - 16, h: frame.h - 16 } });
    for (const g of gs) { const c = ring.get(g); const inner = arrange(s.groups.get(g).map((l) => boxes.find((b) => b.id === ids.get(l))).filter((b) => b && !at.has(b.id)), 'column', { frame: { x: c.x + 6, y: c.y + 6, w: c.w - 12, h: c.h - 12 }, gap: 1 }); for (const [i, b] of inner) at.set(i, b); }
    for (const b of boxes) if (!at.has(b.id)) at.set(b.id, { x: frame.x, y: frame.y, w: b.w, h: b.h });
  } else if (layout === 'free') at = arrange(boxes, 'scatter', { frame, seed });
  else at = arrange(boxes, layout === 'grid' ? 'grid' : E.length ? 'layers' : 'grid', { edges: E, frame });
  const nodes = s.nodes.map((l, i) => { const role = roleOf(l, i, s.nodes.length), b = at.get(ids.get(l)); return { id: ids.get(l), label: l, role, shape: shapes.get(role) ?? null, x: +b.x.toFixed(1), y: +b.y.toFixed(1) }; });
  const groups = [...s.groups].map(([g, ms], i) => ({ id: `${id}.g${i + 1}`, label: g, members: ms.map((m) => ids.get(m)).filter(Boolean) }));
  const edges = k.edges === 'none' ? [] : E.map(([a, b]) => ({ from: a, to: b }));
  const lines = [`@${id} w.diagram.diagram title=${val(`${k.name} of ${topic}`)} form=${k.form} layout=${layout} topic=${val(topic)}`];
  for (const g of groups) lines.push(`@${g.id} w.diagram.group label=${val(g.label)} diagram=$${id}`);
  for (const [i, n] of nodes.entries()) {
    const gs = groups.filter((g) => g.members.includes(n.id)).map((g) => ` group=$${g.id}`).join('');
    const parent = k.form === 'tree' || k.form === 'org_chart' ? E.find(([, b]) => b === n.id)?.[0] : null;
    lines.push(`@${n.id} w.diagram.node label=${val(n.label)} diagram=$${id}${n.role ? ` role=${n.role}` : ''}${n.shape ? ` shape=${n.shape}` : ''} n=${i + 1} x=${n.x} y=${n.y}${parent ? ` parent=$${parent}` : ''}${gs}`);
  }
  for (const [i, e] of edges.entries()) lines.push(`@${id}.e${i + 1} w.diagram.edge from=$${e.from} to=$${e.to} direction=${k.edges === 'directed' ? 'forward' : 'none'} diagram=$${id}`);
  const text = lines.join('\n');
  const out = { kind: k.name, form: k.form, layout, topic, fill: `${fill.type}.${fill.key}`, text, nodes, edges, groups };
  if (into) out.told = into.tell(text);
  return out;
}

/**
 * Topics a kind can be drawn about: the values of its fills' topic keys (or the names of their facts),
 * each with at least `min` (3) nodes, most nodes first. [{ topic, nodes, fill }].
 */
export function diagramTopics(world, kind, { min = 3, max = 12, limit = 30 } = {}) {
  const k = kindOf(world, kind);
  if (!k) return [];
  const out = new Map();
  for (const f of k.fills) {
    const facts = world.ofType(f.type);
    const cands = new Set();
    for (const x of facts) for (const v of (f.topic ? x.attrs[f.topic] : x.attrs.name) || []) { cands.add(bare(v)); if (cands.size >= limit * 4) break; }
    for (const t of cands) {
      if (out.has(t)) continue;
      const s = structureOf(world, f, t, { max });
      const n = Math.max(s.nodes.length, s.groups.size ? s.groups.size + 1 : 0);
      if (n >= min) out.set(t, { topic: t, nodes: n, fill: `${f.type}.${f.key}` });
    }
  }
  return [...out.values()].sort((a, b) => b.nodes - a.nodes || a.topic.localeCompare(b.topic)).slice(0, limit);
}

/** A random diagram, kind × topic from knowledge (seeded): composeDiagram's result, or { why } when no kind has a topic. */
export function sampleDiagram(world, { seed = 1, kinds, ...options } = {}) {
  const r = rnd(seed);
  const ks = diagramKinds(world).filter((k) => !kinds || kinds.includes(k.name) || kinds.includes(k.form)).map((k) => [k, r()]).sort((a, b) => a[1] - b[1]).map(([k]) => k);
  for (const k of ks) {
    const ts = diagramTopics(world, k.name, { limit: 10 });
    if (!ts.length) continue;
    const t = ts[Math.floor(r() * ts.length)];
    const d = composeDiagram(world, { ...options, kind: k.name, topic: t.topic, seed });
    if (!d.why) return d;
  }
  return { why: 'no diagram kind has a topic in this world' };
}
