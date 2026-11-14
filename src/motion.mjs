// std.motion: states over time from rules (anything that changes by rules: a face that
// blinks and talks, a drawing that moves, a diagram that highlights its steps). Pure and
// seeded: `motionPlan` turns rules and events into change points; `motionRun` plays a plan
// through the host's clock. No timers and no DOM inside the plan.
//
// Rules are facts (default type names):
//   mo.base key= value=                                  the state when no rule holds a key
//   mo.rule name= on=<event>? when.<field>=<v>? priority=<n>? repeat=<min>-<max>? ease=<ms>?
//        split=<splitter>? else=<value>?                  when a rule fires
//   mo.step rule= n=<order> key= value=? dur=<min>-<max> per=unit?
//        a step: sets `key` for a duration (ms, a range: the seed chooses); `per=unit`: one
//        step per unit of the event's stream, its value from the rule's class table
//   mo.class rule= unit= value=                           a unit of the stream -> a state
// A higher priority holds a key over a lower one while both hold it (a talking mouth over an
// expression mouth); other keys go on (blinking still happens). A new event of the same rule
// cancels what was left of the earlier one. `ease` returns the keys to base after that long.

const unq = (t) => String(t).replace(/^"|"$/g, '');
const range = (r) => { const [a, b] = unq(r ?? '0').split('-').map(Number); return [a, Number.isFinite(b) ? b : a]; };

/** A seeded generator (mulberry32): the same seed gives the same plan. */
function rng(seed) {
  let x = seed >>> 0;
  return () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function rulesOf(world, T) {
  const steps = world.ofType(T.step).map((s) => ({ rule: unq(s.attrs.rule[0]), n: Number(s.attrs.n?.[0] ?? 0), key: unq(s.attrs.key[0]), value: s.attrs.value ? unq(s.attrs.value[0]) : null, dur: range(s.attrs.dur?.[0]), per: s.attrs.per?.[0] === 'unit' }));
  const classes = world.ofType(T.cls).map((c) => ({ rule: unq(c.attrs.rule[0]), unit: unq(c.attrs.unit[0]), value: unq(c.attrs.value[0]) }));
  return world.ofType(T.rule).map((r) => ({
    name: unq(r.attrs.name[0]), on: r.attrs.on ? unq(r.attrs.on[0]) : null, priority: Number(r.attrs.priority?.[0] ?? 0),
    repeat: r.attrs.repeat ? range(r.attrs.repeat[0]) : null, ease: r.attrs.ease ? Number(unq(r.attrs.ease[0])) : null,
    split: r.attrs.split ? unq(r.attrs.split[0]) : null, otherwise: r.attrs.else ? unq(r.attrs.else[0]) : null,
    when: Object.fromEntries(Object.entries(r.attrs).filter(([k]) => k.startsWith('when.')).map(([k, v]) => [k.slice(5), unq(v[0])])),
    steps: steps.filter((s) => s.rule === unq(r.attrs.name[0])).sort((a, b) => a.n - b.n),
    classes: new Map(classes.filter((c) => c.rule === unq(r.attrs.name[0])).map((c) => [c.unit, c.value])),
  }));
}

/**
 * The plan: [{ t, key, value }], the change points in time order, from 0 to `until` (ms).
 * `events`: [{ t, type, fields?, stream? }]; `splitters`: { name: (text) => units } (the
 * unit splitter is the rule's parameter: the host's or the animation world's, not the library's).
 */
export function motionPlan(world, events = [], { seed = 1, until = 10000, splitters = {}, types = {} } = {}) {
  const T = { base: 'mo.base', rule: 'mo.rule', step: 'mo.step', cls: 'mo.class', ...types };
  const base = Object.fromEntries(world.ofType(T.base).map((b) => [unq(b.attrs.key[0]), unq(b.attrs.value[0])]));
  const rules = rulesOf(world, T);
  const rand = rng(seed);
  const pick = ([a, b]) => (a === b ? a : Math.round(a + rand() * (b - a)));
  const holds = []; // { key, value, from, to, priority, firing }
  let firing = 0;
  const fire = (rule, t0, ev) => { // bounded: the steps of one rule (and the units of one stream)
    const id = ++firing;
    for (const h of holds) if (h.rule === rule.name && h.to > t0) h.to = Math.max(h.from, t0); // a new event cancels the rest of the earlier one
    let t = t0;
    for (const s of rule.steps) {
      if (s.per) {
        const units = ev?.stream !== undefined && rule.split && splitters[rule.split] ? splitters[rule.split](ev.stream) : [];
        for (const u of units) { const d = pick(s.dur); holds.push({ key: s.key, value: rule.classes.get(u) ?? rule.otherwise ?? base[s.key], from: t, to: t + d, priority: rule.priority, rule: rule.name, firing: id }); t += d; }
      } else { const d = pick(s.dur); if (s.value !== null) holds.push({ key: s.key, value: s.value, from: t, to: t + d, priority: rule.priority, rule: rule.name, firing: id }); t += d; }
    }
    if (rule.ease !== null) for (const s of rule.steps) holds.push({ key: s.key, value: base[s.key], from: t, to: t + rule.ease, priority: rule.priority, rule: rule.name, firing: id });
  };
  for (const r of rules.filter((x) => x.repeat)) for (let t = pick(r.repeat); t < until; t += Math.max(1, pick(r.repeat))) fire(r, t); // bounded: until / the repeat range
  for (const ev of [...events].sort((a, b) => a.t - b.t)) for (const r of rules) {
    if (r.on !== ev.type || r.repeat) continue;
    if (!Object.entries(r.when).every(([k, v]) => String(ev.fields?.[k]) === v)) continue;
    fire(r, ev.t, ev);
  }
  // the value of each key at each change: the highest priority hold, the latest among equals, else base
  const keys = new Set([...Object.keys(base), ...holds.map((h) => h.key)]);
  const out = [];
  for (const key of keys) { // bounded: the keys, then their holds' edges
    const mine = holds.filter((h) => h.key === key && h.to > h.from);
    const edges = [...new Set([0, ...mine.flatMap((h) => [h.from, h.to])])].filter((t) => t <= until).sort((a, b) => a - b);
    let last;
    for (const t of edges) {
      const on = mine.filter((h) => h.from <= t && t < h.to).sort((a, b) => b.priority - a.priority || b.firing - a.firing)[0];
      const v = on ? on.value : base[key];
      if (v !== last && v !== undefined) { out.push({ t, key, value: v }); last = v; }
    }
  }
  return out.sort((a, b) => a.t - b.t || a.key.localeCompare(b.key));
}

/** Play a plan through the host's clock (`{ setTimeout, clearTimeout }`): apply(key, value) at each point. Returns cancel(). */
export function motionRun(plan, apply, clock = globalThis) {
  const timers = plan.map((p) => clock.setTimeout(() => apply(p.key, p.value, p.t), p.t));
  return () => { for (const h of timers) clock.clearTimeout(h); };
}
