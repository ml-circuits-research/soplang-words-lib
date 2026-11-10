// Functions named by core.calc (return a value, or undefined when not applicable)
// and core.test (return a boolean). Signature: (args: string[], world) => result.
// Arguments arrive as SOP Lang values (atoms, "strings", $refs).
//
// Numbers may carry a unit suffix: 10N, 2kg, 9.81m/s2, 30min, 95%.
//   add sub min max   need equal units and keep them        2kg + 3kg = 5kg
//   mul div           combine units as text                  10N / 2kg = 5N/kg,  6m / 2m = 3
//   lt lte gt gte     compare numbers with equal units, or with a bare number; otherwise as text

const QUANTITY = /^(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([A-Za-zµ°%][A-Za-z0-9µ°%/*^.]*)?$/;

/** { n, unit } for a number with an optional unit, or null. */
export function quantity(v) {
  const m = QUANTITY.exec(String(v));
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? { n, unit: m[2] || '' } : null;
}

const show = (n, unit) => (Number.isFinite(n) ? String(Number(n.toPrecision(12))) + unit : undefined);

const sameUnit = (f) => (args) => {
  const qs = args.map(quantity);
  if (!qs.length || qs.some((q) => !q || q.unit !== qs[0].unit)) return undefined;
  return show(qs.map((q) => q.n).reduce(f), qs[0].unit);
};
const mulUnit = (a, b) => (!a ? b : !b ? a : `${a}*${b}`);
const divUnit = (a, b) => (!b ? a : a === b ? '' : `${a || '1'}/${b}`);
const combine = (f, unitOf) => (args) => {
  const qs = args.map(quantity);
  if (!qs.length || qs.some((q) => !q)) return undefined;
  const r = qs.reduce((x, y) => ({ n: f(x.n, y.n), unit: unitOf(x.unit, y.unit) }));
  return show(r.n, r.unit);
};
const cmp = (f) => ([a, b]) => {
  const x = quantity(a), y = quantity(b);
  // a bare number is a threshold for any unit: 0kg <= 0
  return x && y && (x.unit === y.unit || !x.unit || !y.unit) ? f(x.n, y.n) : f(a, b);
};
const seqOf = (world, ref) => world.get(ref.slice(1))?.meta.seq;

export const builtins = {
  add: sameUnit((a, b) => a + b),
  sub: sameUnit((a, b) => a - b),
  min: sameUnit((a, b) => Math.min(a, b)),
  max: sameUnit((a, b) => Math.max(a, b)),
  mul: combine((a, b) => a * b, mulUnit),
  div: combine((a, b) => a / b, divUnit),
  concat: (args) => args.join(''),

  eq: ([a, b]) => a === b,
  neq: ([a, b]) => a !== b,
  lt: cmp((a, b) => a < b),
  lte: cmp((a, b) => a <= b),
  gt: cmp((a, b) => a > b),
  gte: cmp((a, b) => a >= b),
  // before($a, $b): wire a entered the world before wire b
  before: ([a, b], world) => {
    const x = seqOf(world, a), y = seqOf(world, b);
    return x !== undefined && y !== undefined && x < y;
  },
};
