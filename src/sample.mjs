// std.sample (reviewer 14:15): random but relevant commands, from the worlds and their
// knowledge, legal in the current state; no example lists anywhere. A frame is an act with
// its roles (language-free); the host's language world renders it, and a sample is kept only
// if a dry run of the act is not refused (and, when the host gives `realise` and `read`, if
// the sentence reads back to the same frame). Seeded and reproducible.
//
// Where the parts come from: the world schemas (`std.schema.kind`: acts per kind; slots: an
// enum, a range and step, a join `type=T by=k` to knowledge), the open kinds of a catalog
// (`std.schema.kinds from=`), the things of the live world (remove, change, place, ask need
// one), the history (undo needs a step). Weights: `prefer` (a world, a thing), recency (the
// newest things and the world of the open view), novelty (acts, kinds and attributes used
// less in this session, from the history of acts and `options.seen`), and chance.

const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/^\$/, '');

function rng(seed) {
  let x = seed >>> 0;
  return () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pickW = (rand, items) => { // weighted choice: [{ item, w }]
  const total = items.reduce((s, x) => s + x.w, 0);
  if (!items.length || total <= 0) return undefined;
  let r = rand() * total;
  for (const x of items) { r -= x.w; if (r <= 0) return x.item; } // bounded: the items
  return items[items.length - 1].item;
};

/** A value legal for a slot: its enum, a step of its range, a fact a join names; else none. */
function valueFor(world, slot, rand) {
  if (!slot) return undefined;
  if (slot.enum?.length) return slot.enum[Math.floor(rand() * slot.enum.length)];
  if (slot.by && slot.type) { const names = world.ofType(slot.type).flatMap((f) => f.attrs[slot.by] || []).map(bare); return names.length ? names[Math.floor(rand() * names.length)] : undefined; }
  if (slot.min && slot.max) { const step = slot.step?.n || 1, n = Math.floor((slot.max.n - slot.min.n) / step); return String(+(slot.min.n + Math.floor(rand() * (n + 1)) * step).toFixed(6)); }
  return undefined;
}

/**
 * Frames: [{ action, args, world, why }]. Options:
 * - `seed`, `n` (how many), `mode`: `one` (a dice), `few` (3 or 4, all different), `actions`
 *   (the acts that fit `prefer.thing`, for buttons);
 * - `prefer`: { world, thing }; `seen`: frames the session showed already (novelty);
 * - `realise(frame) -> text` and `read(text) -> frame`: the round-trip filter.
 * Returns { frames, tried, kept, roundTrip }.
 */
export function sample(world, { seed = 1, n, mode = 'few', prefer = {}, seen = [], realise, read } = {}) {
  const rand = rng(seed);
  const c = world._compiled();
  const kinds = world.ofType('std.schema.kind').map((k) => ({ type: k.attrs.of[0], worlds: k.attrs.world, acts: k.attrs.acts || [], open: false }));
  const open = world.ofType('std.schema.kinds').map((k) => ({ from: k.attrs.from[0], key: k.attrs.key?.[0] || 'name', world: k.attrs.world[0], acts: k.attrs.acts || [] }));
  const things = world.ofType('std.schema.thing').filter((t) => t.attrs.kind);
  const usedActs = new Map(), usedKinds = new Map();
  for (const e of world.log) if (e.by) usedActs.set(e.by, (usedActs.get(e.by) || 0) + 1); // the session's history of acts
  for (const f of seen) { usedActs.set(f.action, (usedActs.get(f.action) || 0) + 1); const k = f.args?.kind; if (k) usedKinds.set(k, (usedKinds.get(k) || 0) + 1); }
  const novelty = (map, key) => 1 / (1 + (map.get(key) || 0));
  const canUndo = world.log.some((e) => e.by);
  const recent = new Map(things.map((t, i) => [t.id, 1 + i / Math.max(1, things.length)])); // newer things weigh more
  const target = mode === 'actions' && prefer.thing ? world.get(bare(prefer.thing)) : null;

  /** One candidate frame, chosen by weight; or undefined. */
  function candidate() {
    const options = [];
    for (const k of kinds) for (const act of k.acts) for (const wd of k.worlds) {
      if (prefer.world && wd !== prefer.world) continue;
      const mine = things.filter((t) => t.type === k.type || t.attrs.kind?.[0] === k.type);
      if (target && !mine.includes(target)) continue;
      if (['remove', 'change', 'place', 'ask', 'copy', 'pick'].includes(act) && !mine.length) continue; // needs a thing
      if (act === 'make' && target) continue;
      options.push({ item: { kind: k.type, act, world: wd, mine }, w: novelty(usedActs, act) * novelty(usedKinds, k.type) });
    }
    for (const o of open) for (const act of o.acts) {
      if (prefer.world && o.world !== prefer.world) continue;
      const mine = things.filter((t) => t.type === 'std.schema.thing' && t.attrs.world?.includes(o.world));
      if (target && !mine.includes(target)) continue;
      if (act !== 'make' && !mine.length) continue;
      if (act === 'make' && target) continue;
      options.push({ item: { open: o, act, world: o.world, mine }, w: novelty(usedActs, act) });
    }
    if (canUndo && !target && !prefer.world) options.push({ item: { act: 'undo' }, w: 0.2 * novelty(usedActs, 'undo') });
    const ch = pickW(rand, options);
    if (!ch) return undefined;
    if (ch.act === 'undo') return { action: 'undo', args: {}, why: 'there is a step to undo' };
    const pickThing = () => target ?? pickW(rand, ch.mine.map((t) => ({ item: t, w: recent.get(t.id) || 1 })));
    if (ch.open) {
      if (ch.act === 'make') {
        const names = world.ofType(ch.open.from).flatMap((f) => f.attrs[ch.open.key] || []).map(bare);
        const name = names.length ? pickW(rand, names.map((x) => ({ item: x, w: novelty(usedKinds, x) }))) : undefined;
        return name ? { action: 'make', args: { kind: name }, world: ch.world, why: `a ${ch.open.from} the world takes` } : undefined;
      }
      const t = pickThing();
      return t ? { action: ch.act, args: { thing: t.id }, world: ch.world, why: `${t.id} is there` } : undefined;
    }
    const slots = [...(c.slots.get(ch.kind)?.values() || [])].filter((s) => !['kind', 'world'].includes(s.key) && !s.prefix);
    if (ch.act === 'make') {
      const args = { kind: ch.kind };
      for (const s of slots.filter((x) => x.required)) { const v = valueFor(world, s, rand); if (v === undefined) return undefined; args[s.key] = v; }
      const extra = slots.filter((s) => !s.required && (s.enum || s.min || s.by));
      if (extra.length && rand() < 0.6) { const s = extra[Math.floor(rand() * extra.length)]; const v = valueFor(world, s, rand); if (v !== undefined) args[s.key] = v; }
      return { action: 'make', args, world: ch.world, why: `${ch.kind} can be made in ${ch.world}` };
    }
    const t = pickThing();
    if (!t) return undefined;
    if (ch.act === 'change') {
      const s = pickW(rand, slots.filter((x) => x.enum || x.min || x.by).map((x) => ({ item: x, w: 1 })));
      const v = s && valueFor(world, s, rand);
      return v === undefined ? undefined : { action: 'change', args: { thing: t.id, attr: s.key, value: v }, world: ch.world, why: `${t.id} has ${s.key}` };
    }
    if (ch.act === 'ask') { const s = slots[Math.floor(rand() * slots.length)]; return { action: 'ask', args: { thing: t.id, ...(s ? { attr: s.key } : {}) }, world: ch.world, why: `${t.id} is there` }; }
    if (ch.act === 'place') return undefined; // needs a place: left to a host that knows its space
    return { action: ch.act, args: { thing: t.id }, world: ch.world, why: `${t.id} is there` };
  }

  const want = n ?? (mode === 'one' ? 1 : mode === 'few' ? 3 + Math.floor(rand() * 2) : 8);
  const frames = [], keys = new Set();
  let tried = 0, readBack = 0, readTried = 0;
  for (let i = 0; i < want * 20 && frames.length < want; i++) { // bounded: 20 tries per frame wanted
    const f = candidate();
    if (!f) continue;
    tried++;
    const key = JSON.stringify([f.action, f.args]);
    if (keys.has(key)) continue;
    if (!world.fork().act({ action: f.action, args: f.args }).ok) continue; // it works, or it is not suggested
    if (realise && read) {
      readTried++;
      const back = read(realise(f));
      if (!back || back.action !== f.action || JSON.stringify(back.args) !== JSON.stringify(f.args)) continue;
      readBack++;
    }
    keys.add(key);
    frames.push(f);
  }
  return { frames, tried, kept: frames.length, ...(readTried ? { roundTrip: readBack / readTried } : {}) };
}

/** Diversity of frames: distinct acts, kinds and attributes. */
export function diversity(frames) {
  const set = (f) => new Set(frames.map(f).filter((x) => x !== undefined));
  return { frames: frames.length, acts: set((x) => x.action).size, kinds: set((x) => x.args.kind ?? x.args.thing).size, attrs: set((x) => x.args.attr).size };
}
