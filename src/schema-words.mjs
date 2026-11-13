// From a schema to words (Round 21): what a host needs to read and to speak about a world
// declared with std.schema: its card (kinds, attributes, acts, words), example sentences
// per act, and the reply for a done act or a refusal, made from the act's result (`diff`,
// `reason`). One generator, in plain English; hosts translate.

import { str } from './parser.mjs';

const RESERVED = new Set(['kind', 'world']);
const unq = (v) => (typeof v === 'string' && v[0] === '"' ? str(v) : v);
const a = (word) => (/^[aeiou]/i.test(word) && !/^(uni|use|eu|one|once)/i.test(word) ? `an ${word}` : `a ${word}`);
const list = (xs, and = 'and') => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${and} ${xs[xs.length - 1]}`);
const human = (s) => String(s).replace(/_/g, ' ');

/** The words of the world that mean a kind (core.word means=<kind>), else the kind's name. */
function wordsOf(w, kind) {
  const out = [];
  for (const [text, entries] of w.words()) if (entries.some((e) => e.means === kind && !e.of)) out.push(text);
  return out.length ? out : [human(kind)];
}

/** The attributes of a kind as the card shows them. */
function attrsOf(w, type) {
  const slots = w._compiled().slots.get(type);
  if (!slots) return [];
  return [...slots.values()].filter((s) => !RESERVED.has(s.key) && !s.prefix).map((s) => ({
    name: s.key,
    ...(s.kinds?.length ? { kind: s.kinds[0] } : {}),
    ...(s.enum ? { values: [...s.enum] } : {}),
    ...(s.refs?.length ? { refers: [...s.refs] } : {}),
    ...(s.min ? { min: s.min.n } : {}), ...(s.max ? { max: s.max.n } : {}), ...(s.step ? { step: s.step.n } : {}),
    ...(s.default !== undefined ? { default: unq(s.default) } : {}),
    ...(s.required ? { required: true } : {}),
  }));
}

/** The card of each world (or of one): { world, doc, kinds: [{ kind, words, acts, attrs, open?, from?, limit? }] }. */
export function schemaCard(w, name) {
  const worlds = w.ofType('std.schema.world').filter((x) => name === undefined || x.attrs.name[0] === name);
  const limits = new Map(w.ofType('std.schema.limit').map((l) => [l.attrs.of[0], Number(l.attrs.max[0])]));
  return worlds.map((x) => {
    const world = x.attrs.name[0];
    const kinds = w.ofType('std.schema.kind').filter((k) => k.attrs.world[0] === world).map((k) => {
      const kind = k.attrs.of[0];
      return { kind, words: wordsOf(w, kind), acts: [...(k.attrs.acts || [])], attrs: attrsOf(w, kind), ...(limits.has(kind) ? { limit: limits.get(kind) } : {}) };
    });
    for (const k of w.ofType('std.schema.kinds').filter((y) => y.attrs.world[0] === world)) kinds.push({ kind: '*', open: true, from: k.attrs.from[0], acts: [...(k.attrs.acts || [])], attrs: [] });
    return { world, ...(x.attrs.doc ? { doc: unq(x.attrs.doc[0]) } : {}), kinds };
  });
}

/** A value an example can use for an attribute: the first other than the default, a number in range, or a name. */
function sample(attr) {
  if (attr.values) return attr.values.find((v) => v !== attr.default) ?? attr.values[0];
  if (attr.kind === 'number' || attr.min !== undefined) return String(attr.min !== undefined ? Math.min(attr.max ?? attr.min + 1, attr.min + (attr.step ?? 1)) : 2);
  if (attr.refers) return undefined;
  return 'Ana';
}

/** Example sentences per act and kind, with the request each should become: [{ world, act, kind, text, request }]. */
export function schemaExamples(w, name, { per = 1 } = {}) {
  const out = [];
  for (const card of schemaCard(w, name)) {
    for (const k of card.kinds.filter((x) => !x.open)) {
      const word = k.words[0];
      const attrs = k.attrs.filter((x) => sample(x) !== undefined);
      const first = attrs[0], value = first && sample(first);
      const push = (act, text, args) => out.push({ world: card.world, act, kind: k.kind, text, request: { action: act, args } });
      for (const act of k.acts) {
        if (act === 'make') {
          push(act, `make ${a(word)}`, { kind: k.kind });
          if (per > 1 && first) push(act, `make ${a(`${value} ${word}`)}`, { kind: k.kind, [first.name]: value });
        } else if (act === 'remove') push(act, `remove the ${word}`, { thing: k.kind });
        else if (act === 'change' && first) {
          push(act, `make the ${human(first.name)} of the ${word} ${value}`, { thing: k.kind, attr: first.name, value });
          const num = attrs.find((x) => x.kind === 'number' || x.min !== undefined);
          if (num) push(act, `make the ${word} ${human(num.name) === 'size' ? 'bigger' : `more ${human(num.name)}`}`, { thing: k.kind, attr: num.name, by: 'more' });
        } else if (act === 'pick') push(act, `which ${word}s are there?`, { kind: k.kind });
        else if (act === 'ask') push(act, first ? `what ${human(first.name)} is the ${word}?` : `tell me about the ${word}`, first ? { thing: k.kind, attr: first.name } : { thing: k.kind });
        else if (act === 'copy') push(act, `copy the ${word}`, { thing: k.kind });
        else if (act === 'connect') push(act, `connect the ${word} to the other ${word}`, { a: k.kind, b: k.kind });
        else if (act === 'group') push(act, `group the ${word}s`, { things: [k.kind] });
        else if (act === 'place') push(act, `put the ${word} next to the other one`, { thing: k.kind, rel: 'next_to', ref: k.kind });
      }
    }
  }
  return out;
}

/** The reply for an act: what was done, from `result` and `diff`; or why not and what is possible, from `reason`. */
export function actReply(w, request, result) {
  const args = request.args || {};
  const kindOf = (id) => w.get(String(id).replace(/^\$/, ''))?.attrs.kind?.[0] ?? String(id);
  const name = (id) => { const t = w.get(String(id).replace(/^\$/, '')); const n = t?.attrs.name?.[0] ?? t?.attrs.title?.[0]; return n ? `${human(kindOf(id))} ${unq(n)}` : t ? `the ${human(kindOf(id))} (${t.id})` : `the ${human(kindOf(id))}`; };
  if (!result.ok) {
    const v = result.violations?.[0] || {}, r = v.reason || {};
    if (result.status === 'missing') return `I need to know ${list(result.missing.map((m) => m.ask || `the ${human(m.key)}`), 'and')}.`;
    if (r.which) return `Which ${human(r.kind)}? There are ${r.which.length}: ${list(r.which.map(name))}.`;
    const what = r.attr ? `the ${human(r.attr)} of ${a(human(r.kind))}` : r.kind ? a(human(r.kind)) : 'that';
    const parts = [`I can't ${request.action} ${what}: ${unq(v.why || 'it is refused')}.`];
    if (r.hasIt?.length) parts.push(`${list(r.hasIt.map((x) => { const [wd, k] = x.split(':'); return `the ${human(k)} in ${human(wd)}`; })).replace(/^t/, 'T')} ${r.hasIt.length > 1 ? 'have' : 'has'} ${a(human(r.attr))}.`);
    else if (r.attr && r.attrs?.length) parts.push(`${a(human(r.kind))[0].toUpperCase()}${a(human(r.kind)).slice(1)} has ${list(r.attrs.map(human))}.`);
    if (r.allowed && !r.allowed.includes(request.action) && r.allowed.length) parts.push(`I can ${list(r.allowed, 'or')} ${a(human(r.kind))}${r.elsewhere?.length ? `; ${request.action} works in ${list(r.elsewhere.map(human), 'or')}` : ''}.`);
    return parts.join(' ');
  }
  const res = result.result || {};
  switch (res.act) {
    case 'make': return `I made ${a(human(kindOf(res.thing)))} (${res.thing}).`;
    case 'remove': return `I removed the ${human(String(args.thing).replace(/^\$/, '').replace(/\d+$/, ''))}${/\d$/.test(String(args.thing)) ? '' : ` (${res.thing})`}.`;
    case 'change': {
      const c = (result.diff?.changed || []).find((x) => x.id === res.thing && x.key === res.attr);
      return `I changed the ${human(res.attr)} of ${name(res.thing)}${c?.from !== undefined ? ` from ${unq(c.from)}` : ''} to ${unq(res.value)}.`;
    }
    case 'pick': return res.things.length ? `I found ${list(res.things.map(name))}.` : `There is no such ${human(args.kind)}.`;
    case 'ask': return res.attr ? (res.value === null ? `${name(res.thing)} has no ${human(res.attr)}.` : `The ${human(res.attr)} of ${name(res.thing)} is ${unq(res.value)}.`) : `${name(res.thing)}: ${Object.entries(res.attrs).filter(([k]) => !RESERVED.has(k)).map(([k, v]) => `${human(k)} ${unq([].concat(v).join(', '))}`).join(', ')}.`;
    case 'copy': return `I copied ${name(res.from)} (${res.thing}).`;
    case 'connect': return `I connected ${name(args.a)} and ${name(args.b)}.`;
    case 'group': return `I grouped them as ${res.group}.`;
    case 'ungroup': return `I took ${res.group} apart.`;
    default: return `Done: ${request.action}.`;
  }
}
