// std.space (Round 28 item 8): single placement, so a host drops its own placement code.
// Things are boxes (`x y w h` on std.schema things, numbers); a frame is a box (the
// options, or a thing). `placeFor` gives the spot for one thing: relative to another thing
// (left_of, right_of, above, below, near, on, in), inside a named region
// (`std.schema.region name= x= y= w= h=`), or a default spot (the first free place scanning
// the frame). Every spot avoids overlapping the other boxes when it can, and says so when
// it cannot. A relation kind (spatial, containment, flow) is declared in a schema
// (`std.schema.relation name= kind= inverse=?`); `relationsOf` lists them.
import { seeded } from './random.mjs';
import { valueText } from './parser.mjs';

const num = (t, d) => { const n = Number(valueText(t)); return Number.isFinite(n) ? n : d; };
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The boxes of the things: [{ id, kind, x, y, w, h }] (things without x and y are left out). */
export function boxesOf(world, { except } = {}) {
  return world.ofType('std.schema.thing').filter((t) => t.id !== except && t.attrs.x && t.attrs.y)
    .map((t) => ({ id: t.id, kind: t.attrs.kind?.[0], x: num(t.attrs.x[0], 0), y: num(t.attrs.y[0], 0), w: num(t.attrs.w?.[0], 10), h: num(t.attrs.h?.[0], 10) }));
}

/**
 * The spot for one thing of size { w, h }: { x, y, how, overlaps? }. `at`: { rel, ref } (rel
 * one of left_of, right_of, above, below, near, on, in; ref a thing id), { region } or
 * nothing (the default spot). Options: `frame` { x, y, w, h } (default 0 0 100 100), `gap`
 * (default 2), `except` (the thing itself, when it moves).
 */
export function placeFor(world, { w = 10, h = 10 } = {}, at = {}, { frame = { x: 0, y: 0, w: 100, h: 100 }, gap = 2, except } = {}) {
  const others = boxesOf(world, { except });
  const free = (b) => !others.some((o) => overlaps(b, o)) && b.x >= frame.x && b.y >= frame.y && b.x + b.w <= frame.x + frame.w && b.y + b.h <= frame.y + frame.h;
  const scan = (area, how) => { // the first free spot in an area, row by row
    const step = Math.max(1, Math.min(w, h, gap * 2));
    for (let y = area.y; y + h <= area.y + area.h; y += step) for (let x = area.x; x + w <= area.x + area.w; x += step) { // bounded: the area / step
      const b = { x, y, w, h };
      if (free(b) || (how === 'in' && !others.filter((o) => o.id !== at.ref).some((o) => overlaps(b, o)))) return { x, y, how };
    }
    return null;
  };
  if (at.region) {
    const r = world.ofType('std.schema.region').find((x) => x.attrs.name?.[0] === at.region);
    if (!r) return { why: `there is no region ${at.region}` };
    const area = { x: num(r.attrs.x[0], 0), y: num(r.attrs.y[0], 0), w: num(r.attrs.w[0], 0), h: num(r.attrs.h[0], 0) };
    return scan(area, 'region') ?? { x: area.x, y: area.y, how: 'region', overlaps: true };
  }
  if (at.ref) {
    const ref = boxesOf(world).find((b) => b.id === String(at.ref).replace(/^\$/, ''));
    if (!ref) return { why: `${at.ref} has no place yet` };
    const cx = ref.x + (ref.w - w) / 2, cy = ref.y + (ref.h - h) / 2;
    const spots = {
      left_of: [{ x: ref.x - gap - w, y: cy }], right_of: [{ x: ref.x + ref.w + gap, y: cy }],
      above: [{ x: cx, y: ref.y - gap - h }], below: [{ x: cx, y: ref.y + ref.h + gap }], on: [{ x: cx, y: ref.y - h }],
      near: [{ x: ref.x + ref.w + gap, y: cy }, { x: ref.x - gap - w, y: cy }, { x: cx, y: ref.y + ref.h + gap }, { x: cx, y: ref.y - gap - h }],
    };
    if (at.rel === 'in') return scan({ x: ref.x, y: ref.y, w: ref.w, h: ref.h }, 'in') ?? { x: cx, y: cy, how: 'in', overlaps: true };
    const list = spots[at.rel];
    if (!list) return { why: `no placement for ${at.rel}` };
    const ok = list.find((p) => free({ ...p, w, h })) ?? list[0];
    return { x: ok.x, y: ok.y, how: at.rel, ...(free({ ...ok, w, h }) ? {} : { overlaps: true }) };
  }
  return scan(frame, 'default') ?? { x: frame.x, y: frame.y, how: 'default', overlaps: true };
}

/** The relation kinds a schema declares: [{ name, kind, inverse? }], of one kind if given. */
export function relationsOf(world, kind) {
  return world.ofType('std.schema.relation').map((r) => ({ name: r.attrs.name[0], kind: r.attrs.kind?.[0] ?? 'spatial', ...(r.attrs.inverse ? { inverse: r.attrs.inverse[0] } : {}) })).filter((r) => kind === undefined || r.kind === kind);
}

/**
 * Many things laid out at once (reviewer 04:40: a diagram kind's layout; an arrangement request such
 * as "in a circle", "evenly", "left to right"). `nodes` [{ id, w?, h? }] (size default 10 x 10),
 * `layout` one of: row (left to right), column (top to bottom), circle, grid (evenly), radial (the
 * first node in the middle), scatter (seeded, spread apart), path (evenly along `points`, an outline when
 * `closed`: outlineOf gives one), layers (by
 * `edges` [[from, to]]: each node one layer after its furthest source, layers left to right, or top to
 * bottom with `direction: 'down'`). Options `frame` { x, y, w, h } (default 0 0 100 100), `gap`
 * (default 2), `reverse` (right to left, bottom to top, anticlockwise), `seed` (scatter). Returns Map(id -> { x, y, w, h }), each box inside the frame when the frame holds them.
 */
export function arrange(nodes, layout = 'row', { edges = [], frame = { x: 0, y: 0, w: 100, h: 100 }, gap = 2, direction = 'right', reverse = false, seed = 1, points, closed = true } = {}) {
  const ns = nodes.map((n) => ({ id: n.id, w: n.w ?? 10, h: n.h ?? 10 })), out = new Map(), N = ns.length;
  if (reverse) ns.reverse(); // right to left, bottom to top, anticlockwise
  if (!N) return out;
  const cx = frame.x + frame.w / 2, cy = frame.y + frame.h / 2;
  const line = (list, along, x0, y0, len) => { // spread evenly along one axis, centred across the other
    const total = list.reduce((s, n) => s + (along === 'x' ? n.w : n.h), 0), space = Math.max(gap, (len - total) / (list.length + 1));
    let p = (along === 'x' ? x0 : y0) + space;
    for (const n of list) { if (along === 'x') { out.set(n.id, { x: p, y: y0 - n.h / 2, w: n.w, h: n.h }); p += n.w + space; } else { out.set(n.id, { x: x0 - n.w / 2, y: p, w: n.w, h: n.h }); p += n.h + space; } }
  };
  if (layout === 'row') line(ns, 'x', frame.x, cy, frame.w);
  else if (layout === 'column') line(ns, 'y', cx, frame.y, frame.h);
  else if (layout === 'circle') {
    const big = Math.max(...ns.map((n) => Math.max(n.w, n.h)));
    const r = Math.max(0, Math.min(frame.w, frame.h) / 2 - big / 2 - gap);
    ns.forEach((n, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / N; out.set(n.id, { x: cx + r * Math.cos(a) - n.w / 2, y: cy + r * Math.sin(a) - n.h / 2, w: n.w, h: n.h }); });
  } else if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(N * frame.w / frame.h)), rows = Math.ceil(N / cols), cw = frame.w / cols, ch = frame.h / rows;
    ns.forEach((n, i) => { const c = i % cols, r = Math.floor(i / cols); out.set(n.id, { x: frame.x + c * cw + (cw - n.w) / 2, y: frame.y + r * ch + (ch - n.h) / 2, w: n.w, h: n.h }); });
  } else if (layout === 'layers') {
    const ids = new Set(ns.map((n) => n.id)), out1 = new Map(ns.map((n) => [n.id, []])), into = new Map(ns.map((n) => [n.id, []]));
    for (const [a, b] of edges) if (ids.has(a) && ids.has(b) && a !== b) out1.get(a).push(b);
    const state = new Map(); // a cycle is cut at the edge that closes it, walking from the nodes in their order
    const walk = (id) => { state.set(id, 1); for (const b of out1.get(id)) { if (state.get(b) === 1) continue; into.get(b).push(id); if (!state.has(b)) walk(b); } state.set(id, 2); }; // bounded: each node once
    for (const n of ns) if (!state.has(n.id)) walk(n.id);
    const layer = new Map();
    const depth = (id) => { // bounded: each node once, over the edges left (no cycle)
      if (layer.has(id)) return layer.get(id);
      const d = Math.max(-1, ...into.get(id).map(depth)) + 1;
      layer.set(id, d); return d;
    };
    ns.forEach((n) => depth(n.id));
    const L = Math.max(...layer.values()) + 1, groups = Array.from({ length: L }, () => []);
    for (const n of ns) groups[layer.get(n.id)].push(n);
    const down = direction === 'down', step = (down ? frame.h : frame.w) / L;
    groups.forEach((g, k) => {
      const mid = (down ? frame.y : frame.x) + step * (k + 0.5);
      line(g, down ? 'x' : 'y', down ? frame.x : mid, down ? mid : frame.y, down ? frame.w : frame.h);
      for (const n of g) { const b = out.get(n.id); if (down) b.y = mid - n.h / 2; else b.x = mid - n.w / 2; }
    });
  } else if (layout === 'radial') { // the first node in the middle, the others round it
    const [c, ...rest] = ns;
    out.set(c.id, { x: cx - c.w / 2, y: cy - c.h / 2, w: c.w, h: c.h });
    for (const [id, b] of arrange(rest, 'circle', { frame, gap })) out.set(id, b);
  } else if (layout === 'scatter') { // spread out: seeded places, apart where the frame allows
    const r = seeded(seed);
    const placed = [];
    for (const n of ns) {
      let best = null;
      for (let t = 0; t < 20; t++) { // bounded: 20 tries, the one farthest from the others kept
        const b = { x: frame.x + r() * Math.max(0, frame.w - n.w), y: frame.y + r() * Math.max(0, frame.h - n.h), w: n.w, h: n.h };
        const d = placed.length ? Math.min(...placed.map((p) => Math.hypot(p.x - b.x, p.y - b.y))) : Infinity;
        if (!best || d > best.d) best = { b, d };
      }
      placed.push(best.b); out.set(n.id, best.b);
    }
  } else if (layout === 'path') { // along a polyline (an outline: outlineOf), evenly by length; `closed` joins the last point to the first
    const pts = (points || []).map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : p));
    if (pts.length < 2) throw new Error('sopworld: arrange: a path needs two points or more');
    const segs = [];
    for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; segs.push({ a, b, len: Math.hypot(b.x - a.x, b.y - a.y) }); }
    const total = segs.reduce((t, g) => t + g.len, 0), step = total / (closed ? N : Math.max(1, N - 1));
    ns.forEach((n, k) => { // bounded: the nodes, each walks the segments once
      let d = k * step, g = segs[0];
      for (g of segs) { if (d <= g.len || g === segs[segs.length - 1]) break; d -= g.len; }
      const f = g.len ? Math.min(1, d / g.len) : 0, x = g.a.x + (g.b.x - g.a.x) * f, y = g.a.y + (g.b.y - g.a.y) * f;
      out.set(n.id, { x: x - n.w / 2, y: y - n.h / 2, w: n.w, h: n.h });
    });
  } else throw new Error(`sopworld: arrange: unknown layout ${layout}`);
  return out;
}

/**
 * An arrangement request read by the language world's phrases (`w.lang.en.arrangement text= layout=
 * relation= direction= inverse= diagram_layout=`): the longest phrase in the text. Returns { text, layout
 * (the k.layouts arrangement), relation, direction, reverse, diagramLayout, as (the `arrange` layout) } or
 * null when the text names no arrangement.
 */
export function arrangementOf(world, text, { lang = 'w.lang.en' } = {}) {
  const t = ` ${String(text).toLowerCase().replace(/[^\p{L}\p{N}-]+/gu, ' ').trim()} `;
  const b = (v) => (v === undefined ? null : valueText(v));
  let best = null;
  for (const a of world.ofType(`${lang}.arrangement`)) {
    const p = b(a.attrs.text[0]).toLowerCase();
    if (t.includes(` ${p} `) && (!best || p.length > best.text.length)) best = { text: p, a };
  }
  if (!best) return null;
  const at = best.a.attrs, layout = b(at.layout?.[0]), direction = b(at.direction?.[0]);
  const AS = { ring: 'circle', row: 'row', column: 'column', grid: 'grid', tree: 'layers', flow: 'row', radial: 'radial', scatter: 'scatter', stack: 'column' };
  return {
    text: best.text, layout, relation: b(at.relation?.[0]), direction,
    reverse: b(at.inverse?.[0]) === 'yes' || ['right_to_left', 'bottom_to_top', 'anticlockwise'].includes(direction),
    diagramLayout: b(at.diagram_layout?.[0]), as: AS[layout] ?? null,
  };
}

/**
 * The outline of a thing drawn from parts (a host's real case: "a diagram in the shape of a house"): the convex
 * hull of the parts' boxes [{ x, y, w, h }] as points in order, counter-clockwise from the lowest-left one
 * (Andrew's monotone chain). A path for `arrange(nodes, 'path', { points })`.
 */
export function outlineOf(parts) {
  const pts = [];
  for (const p of parts) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) pts.push({ x: p.x + dx * (p.w ?? 0), y: p.y + dy * (p.h ?? 0) });
  const P = [...new Map(pts.map((p) => [`${p.x},${p.y}`, p])).values()].sort((a, b) => a.x - b.x || a.y - b.y);
  if (P.length < 3) return P;
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [], upper = [];
  for (const p of P) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); } // bounded: each point pushed and popped once
  for (const p of [...P].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); } // bounded: the same
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
