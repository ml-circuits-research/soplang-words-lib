// Functions named by core.calc (return a value, or undefined when not applicable)
// and core.check (return a boolean). Signature: (args: string[], world) => result.
// Arguments arrive as SOP Lang values (atoms, "strings", $refs).
//
// Numbers may carry a unit suffix: 10N, 2kg, 9.81m/s2, 30min, 95%.
//   add sub min max   need equal units and keep them        2kg + 3kg = 5kg
//   mul div           combine units as text                  10N / 2kg = 5N/kg,  6m / 2m = 3
//   lt lte gt gte     compare numbers with equal units, or with a bare number; clock times
//                     and dates in their own order; otherwise as text
//   eq neq            by value for numbers, clock times and dates (5 = 5.0), else as text

const QUANTITY = /^(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([A-Za-zµ°%][A-Za-z0-9µ°%/*^.]*)?$/;

/** { n, unit } for a number with an optional unit, or null. */
export function quantity(v) {
  const m = QUANTITY.exec(String(v));
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? { n, unit: m[2] || '' } : null;
}

const PLAIN = /^(-?)0*(\d*)(?:\.(\d*?)0*)?([A-Za-zµ°%][A-Za-z0-9µ°%/*^.]*)?$/;

/**
 * One spelling for a plain number (with an optional unit): `5.0`, `05` and `5.` become `5`,
 * `.50` becomes `0.5`. Text that is not such a number comes back as it is. Exact: the
 * digits are kept, nothing is rounded.
 */
export function canonical(v) {
  const c = v.charCodeAt(0);
  if (c > 48 && c < 58 && v.indexOf('.') < 0) return v; // the usual case: 12, 7kg
  const m = PLAIN.exec(v);
  if (!m || (!m[2] && !m[3] && !/\d/.test(v))) return v;
  const int = m[2] || '0', frac = m[3] || '';
  const sign = m[1] && (int !== '0' || frac) ? '-' : '';
  return sign + int + (frac ? '.' + frac : '') + (m[4] || '');
}

// ---- exact arithmetic for relations: a number is a fraction of two BigInts
const RAT = /^(-?)(\d*)(?:\.(\d*))?(?:e([-+]?\d+))?([A-Za-zµ°%][A-Za-z0-9µ°%/*^.]*)?$/;
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a < 0n ? -a : a; }; // bounded: Euclid
const reduce = (n, d) => { const g = gcd(n, d) || 1n; return d < 0n ? { n: -n / g, d: -d / g } : { n: n / g, d: d / g }; };
/** { n, d, unit } for a decimal with an optional unit, or null. */
export function rational(v) {
  const m = RAT.exec(String(v));
  if (!m || (!m[2] && !m[3])) return null;
  const frac = m[3] || '';
  let n = BigInt((m[2] || '0') + frac), d = 10n ** BigInt(frac.length);
  const e = Number(m[4] || 0);
  if (e > 0) n *= 10n ** BigInt(e); else if (e < 0) d *= 10n ** BigInt(-e);
  if (m[1]) n = -n;
  return { ...reduce(n, d), unit: m[5] || '' };
}
/** A fraction as text: exact when the decimal ends, else 12 significant digits. */
function showRational({ n, d }, unit) {
  let rest = d;
  while (rest % 2n === 0n) rest /= 2n; // bounded: the factors of the denominator
  while (rest % 5n === 0n) rest /= 5n; // bounded: the factors of the denominator
  if (rest !== 1n) return String(Number((Number(n) / Number(d)).toPrecision(12))) + unit;
  const neg = n < 0n, a = neg ? -n : n;
  let digits = 0, scaled = a;
  while (scaled % d !== 0n) { scaled *= 10n; digits++; } // bounded: the decimal ends
  const whole = String(scaled / d).padStart(digits + 1, '0');
  const text = digits ? `${whole.slice(0, -digits)}.${whole.slice(-digits)}` : whole;
  return (neg ? '-' : '') + text + unit;
}
/**
 * One unknown of a linear relation: linsolve(k, c, c1, x1, c2, x2, ...) is the x with
 * c*x + c1*x1 + c2*x2 + ... = k. Exact; the values must have one unit.
 */
function linsolve(args, world) {
  const k = rational(args[0]), c = rational(args[1]);
  if (!k || !c || c.n === 0n) return undefined;
  let n = k.n, d = k.d, unit = k.unit;
  for (let i = 2; i + 1 < args.length; i += 2) { // bounded: the terms of one relation
    const cj = rational(args[i]), xj = rational(args[i + 1]);
    if (!cj || !xj) return undefined;
    if (xj.unit && unit && xj.unit !== unit) { world?.cannot?.(`the units differ (${unit}, ${xj.unit})`); return undefined; }
    unit = unit || xj.unit;
    // n/d - cj*xj
    const tn = cj.n * xj.n, td = cj.d * xj.d;
    n = n * td - tn * d;
    d *= td;
  }
  return showRational(reduce(n * c.d, d * c.n), unit);
}

const show = (n, unit) => (Number.isFinite(n) ? String(Number(n.toPrecision(12))) + unit : undefined);

// A function that cannot give a result returns nothing, and may tell the world why
// (world.cannot): a query can then say "unsupported" with the reason instead of "missing".
const sameUnit = (f) => (args, world) => {
  const qs = args.map(quantity);
  if (!qs.length || qs.some((q) => !q)) return undefined;
  if (qs.some((q) => q.unit !== qs[0].unit)) { world?.cannot?.(`the units differ (${args.join(', ')})`); return undefined; }
  return show(qs.map((q) => q.n).reduce(f), qs[0].unit);
};
const mulUnit = (a, b) => (!a ? b : !b ? a : `${a}*${b}`);
const divUnit = (a, b) => (!b ? a : a === b ? '' : `${a || '1'}/${b}`);
const combine = (f, unitOf) => (args, world) => {
  const qs = args.map(quantity);
  if (!qs.length || qs.some((q) => !q)) return undefined;
  const r = qs.reduce((x, y) => ({ n: f(x.n, y.n), unit: unitOf(x.unit, y.unit) }));
  if (!Number.isFinite(r.n)) world?.cannot?.(qs.slice(1).some((q) => q.n === 0) ? 'division by zero' : 'the result is not a number');
  return show(r.n, r.unit);
};
// ---- clock times (H:MM, HH:MM, HH:MM:SS) and dates (YYYY-MM-DD)

const CLOCK = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY = 86400000;
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const UNIT_SECONDS = { s: 1, sec: 1, min: 60, m: 60, h: 3600, d: 86400, day: 86400, days: 86400, w: 604800, week: 604800, weeks: 604800 };

/** Seconds since midnight for a clock time, or null. */
export function clock(v) {
  const m = CLOCK.exec(String(v));
  if (!m || Number(m[1]) > 24 || Number(m[2]) > 59 || Number(m[3] || 0) > 59) return null;
  return { seconds: Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0), withSeconds: m[3] !== undefined };
}
/** Milliseconds (UTC midnight) for a calendar date, or null when it is not a real date. */
export function date(v) {
  const m = DATE.exec(String(v));
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(t);
  return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? t : null;
}
const two = (n) => String(n).padStart(2, '0');
const showClock = (seconds, withSeconds) => {
  const t = ((Math.round(seconds) % 86400) + 86400) % 86400; // wraps around midnight
  return `${two(Math.floor(t / 3600))}:${two(Math.floor((t % 3600) / 60))}${withSeconds ? ':' + two(t % 60) : ''}`;
};
const showDate = (ms) => new Date(ms).toISOString().slice(0, 10);
/** A duration in seconds: a bare number counts in `unit`. */
const duration = (v, unit) => {
  const q = quantity(v);
  if (!q) return undefined;
  const k = UNIT_SECONDS[q.unit || unit];
  return k === undefined ? undefined : q.n * k;
};
/** A value both sides can be ordered by, when they are of the same sort: number with unit, clock, date. */
const ordered = (a, b) => {
  const x = quantity(a), y = quantity(b);
  if (x && y && (x.unit === y.unit || !x.unit || !y.unit)) return [x.n, y.n]; // a bare number is a threshold for any unit
  const ca = clock(a), cb = clock(b);
  if (ca && cb) return [ca.seconds, cb.seconds];
  const da = date(a), db = date(b);
  if (da !== null && db !== null) return [da, db];
  return null;
};
const cmp = (f) => ([a, b]) => {
  const o = ordered(a, b);
  return o ? f(o[0], o[1]) : f(a, b);
};
const same = ([a, b]) => {
  if (a === b) return true;
  const o = ordered(a, b);
  return !!o && o[0] === o[1] && !(quantity(a) && quantity(b) && quantity(a).unit !== quantity(b).unit);
};
const one = (f) => ([a, ...rest]) => {
  const q = quantity(a);
  return q ? f(q, rest) : undefined;
};
// ---- text --------------------------------------------------------------------------------
// The text of a value: a string's text, an atom as it is. A result is an atom when it is a
// number (so that it compares as one), else a string.
const textOf = (v) => (typeof v === 'string' && v[0] === '"' ? JSON.parse(v.replace(/[\u0000-\u001f]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`)) : String(v ?? ''));
const asValue = (t) => (/^-?\d+(\.\d+)?$/.test(t) ? t : JSON.stringify(t));
const MAX_TEXT = 100000;
const regexCache = new Map();

/**
 * A regular expression that cannot take long: at most 200 characters, no back-references,
 * and no repeated group that holds a repetition or an empty alternative (`(a+)+`, `(a*)*`,
 * `(|a)+`): the shapes whose matching can take exponential time. Returns the RegExp, or
 * the reason it is refused.
 */
export function safeRegex(pattern) {
  if (regexCache.has(pattern)) return regexCache.get(pattern);
  const refuse = (why) => { const r = { refused: `the pattern ${JSON.stringify(pattern)} ${why}` }; regexCache.set(pattern, r); return r; };
  if (pattern.length > 200) return refuse('is longer than 200 characters');
  if (/\\[1-9]|\\k</.test(pattern)) return refuse('uses a back-reference');
  const stack = [{ rep: false, empty: false }];
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) { // bounded: the pattern
    const ch = pattern[i];
    if (ch === '\\') { i++; continue; }
    if (inClass) { if (ch === ']') inClass = false; continue; }
    if (ch === '[') { inClass = true; continue; }
    if (ch === '(') { stack.push({ rep: false, empty: pattern[i + 1] === '|' || pattern[i + 1] === ')' }); continue; }
    if (ch === '|' && (pattern[i + 1] === '|' || pattern[i + 1] === ')')) stack.at(-1).empty = true;
    const quantifier = ch === '*' || ch === '+' || ch === '?' || ch === '{';
    if (ch === ')') {
      const g = stack.length > 1 ? stack.pop() : { rep: false, empty: false };
      const q = pattern[i + 1];
      if ((q === '*' || q === '+' || q === '{' || q === '?') && (g.rep || g.empty) && q !== '?') return refuse('repeats a group that can repeat or match nothing, which can take exponential time');
      if (q === '*' || q === '+' || q === '?' || q === '{' || g.rep) stack.at(-1).rep = true;
      continue;
    }
    if (quantifier) stack.at(-1).rep = true;
  }
  let re;
  try { re = new RegExp(pattern, 'u'); } catch (e) { return refuse(`is not a regular expression (${e.message})`); }
  regexCache.set(pattern, re);
  return re;
}

const text = {
  // matches(text, pattern): true when the pattern matches somewhere in the text; in a calc
  // the match, or with a third argument n the n-th group
  matches: ([t, p, n], world) => {
    const re = safeRegex(textOf(p));
    if (re.refused) { world?.cannot?.(re.refused); return undefined; }
    const s = textOf(t);
    if (s.length > MAX_TEXT) { world?.cannot?.(`the text is longer than ${MAX_TEXT} characters`); return undefined; }
    const m = re.exec(s);
    if (!m) return undefined;
    const got = m[n === undefined ? 0 : Number(n)];
    return got === undefined ? undefined : asValue(got);
  },
  contains: ([t, part]) => textOf(t).includes(textOf(part)),
  starts_with: ([t, part]) => textOf(t).startsWith(textOf(part)),
  ends_with: ([t, part]) => textOf(t).endsWith(textOf(part)),
  lower: ([t]) => asValue(textOf(t).toLowerCase()),
};

export const builtins = {
  ...text,
  add: sameUnit((a, b) => a + b),
  sub: sameUnit((a, b) => a - b),
  min: sameUnit((a, b) => Math.min(a, b)),
  max: sameUnit((a, b) => Math.max(a, b)),
  mul: combine((a, b) => a * b, mulUnit),
  div: combine((a, b) => a / b, divUnit),
  concat: (args) => args.join(''),
  abs: one((q) => show(Math.abs(q.n), q.unit)),
  // round(x), round(x, digits)
  round: one((q, [digits]) => { const k = 10 ** (Number(digits) || 0); return show(Math.round(q.n * k) / k, q.unit); }),
  // mod(a, b) keeps the unit of a; idiv(a, b) is the whole part of a / b
  mod: ([a, b]) => { const x = quantity(a), y = quantity(b); return x && y && y.n !== 0 ? show(((x.n % y.n) + y.n) % y.n, x.unit) : undefined; },
  idiv: ([a, b], world) => { const x = quantity(a), y = quantity(b); if (x && y && y.n === 0) world?.cannot?.('division by zero'); return x && y && y.n !== 0 ? show(Math.floor(x.n / y.n), divUnit(x.unit, y.unit)) : undefined; },

  // time_add(10:40, 35min) = 11:15, time_add(2026-01-30, 3d) = 2026-02-02; a bare number is minutes or days
  time_add: ([t, d]) => {
    const c = clock(t);
    if (c) { const s = duration(d, 'min'); return s === undefined ? undefined : showClock(c.seconds + s, c.withSeconds); }
    const day = date(t);
    if (day === null) return undefined;
    const s = duration(d, 'd');
    return s === undefined ? undefined : showDate(day + Math.round(s / 86400) * DAY);
  },
  // time_diff(later, earlier): minutes between two clock times, days between two dates
  time_diff: ([a, b]) => {
    const x = clock(a), y = clock(b);
    if (x && y) return show((x.seconds - y.seconds) / 60, 'min');
    const p = date(a), q = date(b);
    return p !== null && q !== null ? show(Math.round((p - q) / DAY), 'd') : undefined;
  },
  weekday: ([d]) => { const t = date(d); return t === null ? undefined : WEEKDAYS[new Date(t).getUTCDay()]; },

  // equality by value where both sides are numbers, clock times or dates: 5 = 5.0, 9:05 = 09:05
  eq: same,
  neq: (args) => !same(args),
  lt: cmp((a, b) => a < b),
  lte: cmp((a, b) => a <= b),
  gt: cmp((a, b) => a > b),
  gte: cmp((a, b) => a >= b),
  // before($a, $b), after($a, $b): the place of two wires in the sequence
  before: ([a, b], world) => world.has(a.slice(1)) && world.has(b.slice(1)) && world.compare(a.slice(1), b.slice(1)) < 0,
  after: ([a, b], world) => world.has(a.slice(1)) && world.has(b.slice(1)) && world.compare(a.slice(1), b.slice(1)) > 0,
};

// ---- aggregates: functions over all the matches of a pattern (core.calc with over=)

const numbers = (values) => {
  const qs = values.map(quantity);
  return qs.length && qs.every((q) => q && q.unit === qs[0].unit) ? qs : null;
};
const extreme = (values, picks, better) => {
  let best = -1, key = null;
  for (let i = 0; i < values.length; i++) { // bounded: one pass over the matches
    const o = key === null ? null : ordered(values[i], key);
    if (key === null || (o ? better(o[0], o[1]) : better(values[i], key))) { best = i; key = values[i]; }
  }
  return best < 0 ? undefined : { value: key, pick: picks[best] };
};
/** name -> (values, picks, matches) => result, or undefined when there is nothing to say. */
builtins.linsolve = linsolve;

export const aggregates = {
  count: (values, picks, n) => String(n),
  sum: (values) => { if (!values.length) return '0'; const qs = numbers(values); return qs ? show(qs.reduce((t, q) => t + q.n, 0), qs[0].unit) : undefined; },
  min: (values, picks) => extreme(values, picks, (a, b) => a < b)?.value,
  max: (values, picks) => extreme(values, picks, (a, b) => a > b)?.value,
  argmin: (values, picks) => extreme(values, picks, (a, b) => a < b)?.pick,
  argmax: (values, picks) => extreme(values, picks, (a, b) => a > b)?.pick,
  collect: (values) => (values.length ? [...new Set(values)] : undefined),
};

