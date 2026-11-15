// What a live world declares, and the checks and properties that follow from the declarations alone (skill
// author-live-world). No world is named here: everything is read from std.schema.kind, std.schema.honours, the slots
// and the k.expect facts of the world given.
import { capabilitiesOf, planRequest, runPlan, REQUEST_KEYS, VALUE_TYPES } from '../../src/index.mjs';

const first = (w, k) => (w.attrs[k] ?? [])[0];
const slotsOf = (live, kind) => { const m = live._compiled().slots.get(kind); return m ? [...m.values()] : []; };

/** The declarations of a live world: kinds with acts, honours, slots per kind, wholes and parts (k.expect), words. */
export function declarationsOf(live) {
  const cap = capabilitiesOf(live);
  const A = live._compiled().actions ?? new Map(), acts = new Set(A instanceof Map ? A.keys() : Object.keys(A));
  const parent = live._compiled().parent ?? new Map();
  const isA = (k, t) => { for (let x = k, i = 0; x && i < 32; x = parent.get(x), i++) if (x === t) return true; return false; };
  const slots = new Map([...cap.kinds.keys()].map((k) => [k, slotsOf(live, k)]));
  const wholes = live.ofType('k.expect.make').map((m) => first(m, 'thing'));
  const parts = live.ofType('k.expect.part').map((p) => ({ of: first(p, 'of'), part: first(p, 'part'), shapes: p.attrs.shape ?? [] }));
  const words = live.ofType('core.word').map((w) => ({ id: w.id, means: first(w, 'means'), text: w.attrs.text ?? [] }));
  return { cap, acts, slots, wholes, parts, words, isA };
}

/**
 * Coverage of the declarations: what the planner can rely on and where a declaration is missing or not generic.
 * Each finding: `{ level: 'error' | 'gap' | 'advice', what }`.
 */
export function coverageOf(live) {
  const D = declarationsOf(live), out = [];
  const say = (level, what) => out.push({ level, what });
  for (const [kind, acts] of D.cap.kinds) for (const a of acts) if (!D.acts.has(a)) say('error', `kind ${kind} declares act ${a}, which no action of the world defines`);
  for (const h of D.cap.honours) {
    for (const k of h.of) if (!D.cap.kinds.has(k)) say('error', `honours ${h.act} of=${k}: ${k} is not a declared kind`);
    for (const on of h.on) if (!REQUEST_KEYS.includes(on)) say('error', `honours ${h.act} on=${on}: not a request key (${REQUEST_KEYS.join(', ')})`);
  }
  const honoured = new Set(D.cap.honours.map((h) => h.act));
  const undeclared = new Map();
  for (const [kind, acts] of D.cap.kinds) for (const a of acts) if (!honoured.has(a)) undeclared.set(a, [...(undeclared.get(a) ?? []), kind]);
  for (const [a, kinds] of undeclared) say('gap', `act ${a} (of ${kinds.join(', ')}) has no std.schema.honours row: the planner reads only its target, every constraint said is refused as not declared`);
  for (const [kind, slots] of D.slots) for (const s of slots) {
    if (s.enum && VALUE_TYPES[s.key]) say('advice', `slot ${kind}.${s.key} lists values the knowledge has (${VALUE_TYPES[s.key].join(' / ')}): join by key (type= by=) instead of an enum`);
  }
  for (const w of D.words) say('advice', `core.word ${w.id} (${w.text.join(', ')} -> ${w.means}) is in the world: words belong in the language world, unless they are this world's own names`);
  for (const p of D.parts) for (const s of p.shapes) if (!D.cap.kinds.has(s)) say('gap', `k.expect.part of=${p.of} shape=${s}: ${s} is not a declared kind`);
  return out;
}

/** A value for a constraint on `on`, taken from the world's own declarations (an enum of a slot), else a neutral one. */
function valueFor(D, on, kinds) {
  const slots = kinds.flatMap((k) => D.slots.get(k) ?? []);
  const en = (key) => slots.find((s) => s.key === key && s.enum?.length)?.enum[0];
  switch (on) {
    case 'count': return { number: 3 };
    case 'size': case 'extent': return { value: 'small', step: 'small' };
    case 'layout': return { value: en('layout') ?? 'grid' };
    case 'attribute': { const s = slots.find((x) => x.enum?.length && !['kind', 'world', 'layout'].includes(x.key)); return s ? { value: s.enum[0], attribute: s.key } : { value: 'red', attribute: 'colour' }; }
    case 'place': { const ref = slots.find((x) => x.refs?.length)?.refs[0]; const k = ref && [...D.cap.kinds.keys()].find((x) => D.isA(x, ref)); return { value: k ?? 'corner' }; } // a kind of the things a slot refers to
    case 'manner': return { value: 'random' };
    case 'with': return { value: kinds[0] ?? 'thing' };
    case 'about': return { value: 'bees' };
    case 'length': return { number: 2 };
    case 'kind': return { value: kinds[0], want: 'no' };
    default: return { value: 'x' };
  }
}

/**
 * Properties generated from the declarations: every request key × every kind an act honours × this world. The
 * property for one cell: the constraint is honoured and lands in the plan, or it is named (notHonoured with a code,
 * or a refusal in `cannot`); it is never silently dropped. A key the act does not honour must be named. Returns
 * `{ cells, held, failed: [{ act, of, on, why }], gaps: [{ act, of, on, code }] }` (gaps: honoured but named, a
 * declaration that promises what nothing takes).
 */
export function generatedProperties(live, { catalog = [], acts = ['make'] } = {}) {
  const D = declarationsOf(live), failed = [], gaps = [];
  let cells = 0, held = 0;
  const merged = new Map(); // the rows of one act together, as the planner reads them
  for (const x of D.cap.honours.filter((y) => acts.includes(y.act))) {
    const m = merged.get(x.act) ?? { act: x.act, of: new Set(), on: new Set(), all: false };
    for (const k of x.of) m.of.add(k); for (const k of x.on) m.on.add(k); if (!x.of.length) m.all = true;
    merged.set(x.act, m);
  }
  for (const h of merged.values()) {
    for (const of of h.all ? [...D.cap.kinds.keys()] : [...h.of]) {
      const items = D.parts.filter((p) => p.of === of).flatMap((p) => (p.shapes.length ? p.shapes : [p.part])).filter((k) => D.cap.kinds.has(k));
      const kinds = [of, ...items];
      for (const on of REQUEST_KEYS) {
        cells++;
        const v = valueFor(D, on, on === 'kind' ? (items.length ? items : [of]) : kinds);
        const c = { on, want: v.want ?? 'yes', words: `<${on}>`, ...v };
        delete c.step; if (on === 'size' || on === 'extent') c.value = 'small';
        const plan = planRequest(live, { act: h.act, target: of, text: `<${h.act} ${of} ${on}>`, unread: [], constraints: [c] }, { catalog });
        const named = plan.notHonoured.find((n) => n.on === on);
        const refused = !plan.ok && plan.cannot?.length;
        let ok;
        if (!h.on.has(on)) ok = !!named || refused; // P8 generated: a key the act does not honour is named
        else if (named) { ok = true; if (named.code !== 'nothing_left') gaps.push({ act: h.act, of, on, code: named.code }); }
        else if (refused) ok = true; // a named refusal (for example: the value breaks a hard constraint)
        else {
          const seen = JSON.stringify([plan.roles, plan.steps.map((s) => s.args)]);
          const val = String(c.value ?? c.number ?? '');
          ok = on === 'kind' ? !runPlan(live.fork ? live.fork() : live, plan).result?.kinds?.[c.value] : (on === 'manner' || seen.includes(val) || plan.roles?.[on] != null || plan.steps.some((st) => st.args?.[on] != null));
        }
        if (ok) held++; else failed.push({ act: h.act, of, on, why: 'neither honoured in the plan nor named' });
      }
    }
  }
  return { cells, held, failed, gaps };
}

/** Which of the request properties P1-P11 (test/request.test.mjs) the declarations enable, by the same conditions. */
export function enabledProperties(live) {
  const D = declarationsOf(live), h = D.cap.honours.find((x) => x.act === 'make');
  if (!h) return [];
  const made = h.of.filter((k) => D.cap.kinds.get(k)?.has('make'));
  const whole = h.of.find((k) => D.wholes.includes(k));
  const partKinds = D.parts.filter((p) => p.of === whole).flatMap((p) => p.shapes.length ? p.shapes : [p.part]).filter((k) => D.cap.kinds.get(k)?.has('make'));
  const refs = made.some((k) => (D.slots.get(k) ?? []).some((s) => s.refs?.length));
  const styled = made.some((k) => (D.slots.get(k) ?? []).some((s) => s.enum && !['kind', 'world'].includes(s.key)));
  const P = { P1: partKinds.length > 0, P2: h.on.has('count') && !!whole, P3: h.on.has('size') || h.on.has('extent'), P4: !!whole, P5: !!whole, P6: !!whole, P7: !!whole, P8: REQUEST_KEYS.some((k) => !h.on.has(k)), P9: made.length > 0, P10: refs, P11: styled };
  return Object.entries(P).filter(([, v]) => v).map(([k]) => k);
}
