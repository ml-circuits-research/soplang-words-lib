// std.space (Round 28 item 8): single placement, so a host drops its own placement code.
// Things are boxes (`x y w h` on std.schema things, numbers); a frame is a box (the
// options, or a thing). `placeFor` gives the spot for one thing: relative to another thing
// (left_of, right_of, above, below, near, on, in), inside a named region
// (`std.schema.region name= x= y= w= h=`), or a default spot (the first free place scanning
// the frame). Every spot avoids overlapping the other boxes when it can, and says so when
// it cannot. A relation kind (spatial, containment, flow) is declared in a schema
// (`std.schema.relation name= kind= inverse=?`); `relationsOf` lists them.

const num = (t, d) => { const n = Number(String(t ?? '').replace(/^"|"$/g, '')); return Number.isFinite(n) ? n : d; };
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
