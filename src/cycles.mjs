// Cycles and clocks (reviewer 09:20 L2; real turns: "today is Friday", then "what day is tomorrow"). The members of
// a cycle are facts (`k.time.ordered name= cycle= n= next=`: weekdays, months, seasons, parts of the day, stages of
// a life cycle), so stepping round a cycle and counting the steps between two members are arithmetic over the
// knowledge, not a calendar in code. The 12-hour clock is read and written with words a host gives (English
// defaults until the language world has them). `today` and `now` are the host's; a stated day overrides them.

import { valueText } from './parser.mjs';

const low = (v) => valueText(v).toLowerCase();

/** The cycle a member belongs to: { cycle, members: [names in order], at } or null. Options: `type` ('k.time.ordered'), `cycle` (when a name is in several). */
export function cycleOf(world, member, { type = 'k.time.ordered', cycle } = {}) {
  const m = world.ofType(type).filter((f) => low(f.attrs.name?.[0]) === low(member) && (!cycle || low(f.attrs.cycle?.[0]) === low(cycle)));
  if (!m.length) return null;
  const c = valueText(m[0].attrs.cycle?.[0]);
  const members = world.ofType(type).filter((f) => valueText(f.attrs.cycle?.[0]) === c).sort((a, b) => Number(valueText(a.attrs.n?.[0])) - Number(valueText(b.attrs.n?.[0]))).map((f) => valueText(f.attrs.name[0]));
  return { cycle: c, members, at: members.findIndex((x) => low(x) === low(member)) };
}

/** The member `steps` after `member` round its cycle (negative: before). Null when the member is in no cycle. */
export function cycleAdd(world, member, steps, options = {}) {
  const c = cycleOf(world, member, options);
  if (!c) return null;
  const n = c.members.length;
  return c.members[(((c.at + Number(steps)) % n) + n) % n];
}

/** How many steps forward from `from` to `to` round their cycle (0 for the same member; null when not in one cycle). */
export function cycleDiff(world, from, to, options = {}) {
  const a = cycleOf(world, from, options), b = cycleOf(world, to, { ...options, cycle: a?.cycle });
  if (!a || !b || a.cycle !== b.cycle) return null;
  return (b.at - a.at + a.members.length) % a.members.length;
}

/** A day stated in a text ("today is Friday", "it's Monday today"): the member of `cycle` named after or before a word of `today`, else null. */
export function statedDay(world, text, { cycle = 'week', today = ['today'], type = 'k.time.ordered' } = {}) {
  const names = world.ofType(type).filter((f) => valueText(f.attrs.cycle?.[0]) === cycle).map((f) => valueText(f.attrs.name[0]));
  const toks = String(text).toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
  if (!toks.some((t) => today.includes(t))) return null;
  return names.find((n) => toks.includes(n.toLowerCase())) ?? null;
}

const EN_CLOCK = { oclock: ["o'clock", 'oclock'], half: ['half'], quarter: ['quarter'], past: ['past', 'after'], to: ['to', 'before'], am: ['am', 'a.m.', 'morning'], pm: ['pm', 'p.m.', 'afternoon', 'evening', 'night'], noon: ['noon', 'midday'], midnight: ['midnight'],
  numbers: { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20 } };

/**
 * A time of day read from words: minutes after midnight, or null. "3 o'clock", "half past 3", "quarter to 4",
 * "10 past 6", "3:30", "3:30 pm", "noon", "midnight". A 12-hour time with no am/pm is read as given (3 = 03:00);
 * `pm` in the text adds 12 hours. `words` replaces the English clock words.
 */
export function readClock(text, { words = EN_CLOCK } = {}) {
  const t = ` ${String(text).toLowerCase().replace(/(\d)\s*([ap])\.?m\.?/g, '$1 $2m')} `;
  const has = (list) => list.some((w) => t.includes(` ${w} `));
  const num = (s) => (/^\d+$/.test(s) ? Number(s) : words.numbers[s]);
  if (has(words.noon)) return 12 * 60;
  if (has(words.midnight)) return 0;
  const pm = has(words.pm), am = has(words.am);
  const fix = (h, m) => { let hh = h % 12; if (pm) hh += 12; else if (!am && h === 12) hh = 12; return hh * 60 + m; };
  let m = /(\d{1,2}):(\d{2})/.exec(t);
  if (m) return fix(Number(m[1]), Number(m[2]));
  const toks = t.trim().split(/\s+/);
  const at = (list) => toks.findIndex((x) => list.includes(x));
  const p = at(words.past), b = at(words.to);
  if (p > 0 || b > 0) {
    const i = p > 0 ? p : b, before = toks[i - 1], hour = num(toks[i + 1]);
    const mins = words.half.includes(before) ? 30 : words.quarter.includes(before) ? 15 : num(before);
    if (hour === undefined || mins === undefined) return null;
    return p > 0 ? fix(hour, mins) : fix(hour - 1 || 12, 60 - mins);
  }
  const o = at(words.oclock);
  if (o > 0 && num(toks[o - 1]) !== undefined) return fix(num(toks[o - 1]), 0);
  const lone = toks.map(num).filter((x) => x !== undefined && x >= 1 && x <= 12);
  return lone.length === 1 && (pm || am) ? fix(lone[0], 0) : null;
}

/** A time of day written on the 12-hour clock: "3 o'clock", "half past 3", "quarter past 3", "quarter to 4", else "3:10" (with `ampm`: "3:10 pm"). */
export function writeClock(minutes, { ampm = false, words = { oclock: "o'clock", half: 'half past', quarterPast: 'quarter past', quarterTo: 'quarter to', am: 'am', pm: 'pm' } } = {}) {
  const t = ((Math.round(minutes) % 1440) + 1440) % 1440, h24 = Math.floor(t / 60), m = t % 60;
  const hour = (h) => (h % 12 === 0 ? 12 : h % 12), suffix = ampm ? ` ${h24 < 12 ? words.am : words.pm}` : '';
  if (m === 0) return `${hour(h24)} ${words.oclock}${suffix}`;
  if (m === 30) return `${words.half} ${hour(h24)}${suffix}`;
  if (m === 15) return `${words.quarterPast} ${hour(h24)}${suffix}`;
  if (m === 45) return `${words.quarterTo} ${hour(h24 + 1)}${suffix}`;
  return `${hour(h24)}:${String(m).padStart(2, '0')}${suffix}`;
}

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']; // RFC 5545's day codes, Sunday first as Date.getUTCDay

/**
 * The days of a repeating event (RFC 5545 RRULE, the part a calendar needs; knowledge Q92): `rule` is an RRULE text
 * ("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=6") or an object { freq: daily | weekly | monthly | yearly, interval,
 * byday: ['MO', ...], bymonthday: [n], until: 'YYYY-MM-DD', count }. `start` is the first day (an ISO date). Options:
 * `from` / `to` (a window: only the days in it), `max` (at most this many days, 1000). Returns ISO dates in order. The
 * day names of a language are a language world's (k.time names map to the codes); the rule is language-free.
 */
export function expandRecurrence(rule, start, { from, to, max = 1000 } = {}) {
  const r = typeof rule === 'string' ? Object.fromEntries(rule.replace(/^RRULE:/i, '').split(';').filter(Boolean).map((p) => { const [k, v] = p.split('='); return [k.toLowerCase(), v]; })) : { ...rule };
  const freq = String(r.freq ?? '').toLowerCase(), every = Math.max(1, Number(r.interval ?? 1));
  const list = (v) => (v === undefined ? [] : Array.isArray(v) ? v : String(v).split(','));
  const byday = list(r.byday).map((d) => String(d).toUpperCase().slice(-2)), bymd = list(r.bymonthday).map(Number);
  const iso = (d) => d.toISOString().slice(0, 10);
  const day = (s) => { const t = String(s).replace(/^(\d{4})(\d{2})(\d{2}).*$/, '$1-$2-$3'); return new Date(`${t.slice(0, 10)}T00:00:00Z`); };
  const first = day(start), until = r.until ? day(r.until) : null, count = r.count !== undefined ? Number(r.count) : null;
  const lo = from ? day(from) : null, hi = to ? day(to) : null;
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(freq) || Number.isNaN(first.getTime())) return [];
  const out = [];
  let n = 0;
  const take = (d) => { // a day of the rule: counted from the start, kept if in the window
    if (d < first || (until && d > until)) return true;
    n += 1;
    if (count !== null && n > count) return false;
    if ((!lo || d >= lo) && (!hi || d <= hi)) out.push(iso(d));
    return out.length < max;
  };
  const addDays = (d, k) => new Date(d.getTime() + k * 86400000);
  for (let p = 0; p < 100000; p++) { // bounded: periods, stopped by until, count, the window's end or max
    let days;
    if (freq === 'daily') days = [addDays(first, p * every)];
    else if (freq === 'weekly') { const wk = addDays(first, p * 7 * every - first.getUTCDay()); days = (byday.length ? byday : [WEEKDAYS[first.getUTCDay()]]).map((c) => addDays(wk, WEEKDAYS.indexOf(c))).filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a - b); }
    else if (freq === 'monthly') {
      const y = first.getUTCFullYear(), m = first.getUTCMonth() + p * every;
      const mds = bymd.length ? bymd : byday.length ? [] : [first.getUTCDate()];
      days = mds.map((x) => new Date(Date.UTC(y, m, x))).filter((d) => d.getUTCMonth() === ((m % 12) + 12) % 12); // the 31st only in months that have it
      if (byday.length) { const len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); for (let x = 1; x <= len; x++) { const d = new Date(Date.UTC(y, m, x)); if (byday.includes(WEEKDAYS[d.getUTCDay()])) days.push(d); } days.sort((a, b) => a - b); } // bounded: the days of a month
    } else { const d = new Date(Date.UTC(first.getUTCFullYear() + p * every, first.getUTCMonth(), first.getUTCDate())); days = d.getUTCDate() === first.getUTCDate() ? [d] : []; } // 29 February only in leap years
    for (const d of days) if (!take(d)) return out; // bounded: the days of a period
    const last = days[days.length - 1] ?? addDays(first, p);
    if ((until && last > until) || (hi && last > hi && (count === null || n >= count))) return out;
  }
  return out;
}
