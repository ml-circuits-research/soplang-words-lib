// Realisation of composition frames through a language world's discourse templates (w.lang.en's
// `w.lang.en.discourse`: a move, a register, a text with {slots}). The realiser picks, by seed, a
// template of the frame's move and register whose slots it can all fill, and fills them from the
// frame, the fact it cites, the story plan or the outline. How a fact becomes a clause and a name a
// noun phrase is the language's: `clause(fact, world)`, `np(name)`, `inflect(word, features)`
// come from the host; the defaults only join words (`the penguin`, `the penguin eats fish`).

import { inflectBy, articleFor } from './morph.mjs';
import { choose } from './rank.mjs';
import { phraseOf } from './say.mjs';

const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/^\$/, '');
const META = new Set(['name', 'about', 'kind', 'class', 'is', 'source', 'own', 'cite', 'derived']);

function rng(seed) { let x = seed >>> 0; return () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** The discourse templates a world holds: [{ id, move, register, slots, text }]. */
export function discourseTemplates(world, type = 'w.lang.en.discourse') {
  return world.ofType(type).map((t) => ({ id: t.id, move: bare(t.attrs.move?.[0] ?? ''), register: bare(t.attrs.register?.[0] ?? ''), slots: (t.attrs.slot || []).map(bare), text: bare(t.attrs.text?.[0] ?? '') }));
}

/**
 * A realiser `(frame, register, context) -> { text, template } | null` over the world's discourse
 * templates. `context`: { topic, story (a storyPlan result), outline, previous (frames) }.
 * Options: `seed`, `type`, `clause`, `np`, `inflect`, `fill(slot, frame, context)` (a host's own
 * filler, tried first; undefined falls through).
 */
export function discourseRealiser(world, { seed = 1, type, clause, np, inflect, fill } = {}) {
  const templates = discourseTemplates(world, type);
  const lang = (type ?? 'w.lang.en.discourse').split('.').slice(0, 2).join('.'); // the language world's own inflection and articles, when it has them
  if (!inflect && world.ofType(`${lang}.inflect`).length) inflect = (w, f) => (f.num === 'pl' ? String(w).split(' ').map((x, i, a) => (i === a.length - 1 ? inflectBy(world, x, 'plural', { types: { rule: `${lang}.inflect`, irregular: `${lang}.irregular` } }) : x)).join(' ') : w);
  const dets = new Set(world.ofType(`${lang}.det`).filter((d) => d.attrs.before).map((d) => bare(d.attrs.text[0]).toLowerCase()));
  const rand = rng(seed);
  const NP = np ?? ((n) => `the ${String(n).replace(/_/g, ' ')}`);
  let topicNow = null; // a fact with no about or name is about the topic it names
  const subjectOf = (f) => f && (f.attrs.about?.[0] ?? f.attrs.name?.[0] ?? topicNow);
  const keyOf = (f) => f && Object.keys(f.attrs).find((k) => !META.has(k) && !k.startsWith('core.') && !f.attrs[k].includes(topicNow));
  const phrased = world.ofType(`${(type ?? 'w.lang.en.discourse').split('.').slice(0, 2).join('.')}.phrasing`).length > 0; // the language world's phrasings of facts (Q63), when it has them
  const CLAUSE = clause ?? ((f) => { if (phrased && f) { const p = phraseOf(world, { ...f, attrs: { ...f.attrs, ...(f.attrs.name || f.attrs.about ? {} : { about: [topicNow] }) } }); if (p) return p.text; } const k = keyOf(f); return k ? `${NP(subjectOf(f))} ${k.replace(/_/g, ' ')} ${f.attrs[k].join(' and ')}` : null; });
  const filler = (slot, frame, ctx) => {
    if (fill) { const v = fill(slot, frame, ctx); if (v !== undefined) return v; }
    const f = frame.fact;
    const plan = ctx.story?.plan;
    switch (slot) {
      case 'topic': return ctx.topic && NP(ctx.topic);
      case 'thing': return f ? NP(subjectOf(f)) : ctx.topic && NP(ctx.topic);
      case 'fact': case 'claim': case 'evidence': case 'thesis': return f ? CLAUSE(f, world) : frame.recalls ? CLAUSE(recalled(frame.recalls), world) : ctx.claims?.length ? CLAUSE(recalled(ctx.claims[0]), world) : null; // a move about the topic says the first claim
      case 'attribute': return keyOf(f)?.replace(/_/g, ' ') ?? null;
      case 'value': { const k = keyOf(f); return k ? f.attrs[k][0] : null; }
      case 'example': { const k = keyOf(f); return k ? NP(f.attrs[k][0]) : null; }
      case 'count': return ctx.outline?.length ? String(ctx.outline.length) : null;
      case 'parts': case 'part': {
        const ts = (ctx.outline || []).map((t) => `its ${t.split('.').pop().replace(/_/g, ' ')}`);
        if (!ts.length) return null;
        return slot === 'part' ? ts[0] : ts.length === 1 ? ts[0] : `${ts.slice(0, -1).join(', ')} and ${ts.at(-1)}`;
      }
      case 'setting': case 'protagonist': case 'helper': case 'means': return plan?.[slot] ?? null;
      case 'obstacle': return plan?.obstacle?.split('|')[0] ?? null;
      case 'target': return plan?.target ? NP(plan.target) : null;
      case 'attempt': return frame.element === 'attempt' ? frame.value : [].concat(plan?.attempt ?? [])[0] ?? null;
      case 'goal': { if (!plan?.goal) return null; const act = ctx.goalAct?.(plan.goal); return act ? `${act === 'go' ? 'get to' : act} ${NP(plan.target)}` : plan.goal; }
      case 'overcome': return plan?.resolution ? `${plan.resolution} ${plan.obstacle ? `past ${NP(plan.obstacle.split('|')[0])}` : ''}`.trim() : null;
      default: return null;
    }
  };
  const recalled = (id) => { const w = world.get(id); return w ? { type: w.type, attrs: Object.fromEntries(Object.entries(w.attrs).filter(([k]) => !k.startsWith('core.')).map(([k, vs]) => [k, vs.map(bare)])) } : null; };
  const STORY = new Set(['setting', 'protagonist', 'goal', 'target', 'obstacle', 'attempt', 'helper', 'means', 'overcome']);
  const used = new Set();
  return (frame, register, ctx = {}) => {
    topicNow = ctx.topic ?? null;
    const reg = typeof register === 'string' ? register : register?.name;
    const slotsOf = (t) => [...t.text.matchAll(/\{([a-z_]+)/g)].map((m) => m[1]);
    // a story sentence tells its own element and only elements told before it
    const own = frame.element && STORY.has(frame.element) && frame.element !== 'resolution' ? frame.element : frame.element === 'resolution' ? 'overcome' : null; // an element with a slot of its own
    const tells = (t) => !frame.element || ((!own || slotsOf(t).includes(own))
      && slotsOf(t).every((x) => !STORY.has(x) || x === frame.element || x === 'overcome' && frame.element === 'resolution' || x === 'goal' && ctx.told?.has('goal') || ctx.told?.has(x)));
    const cands = templates.filter((t) => t.move === frame.move && t.register === reg && tells(t));
    const filled = [];
    for (const t of cands) {
      const values = {};
      let ok = true;
      for (const m of t.text.matchAll(/\{([a-z_]+)(?::([^}]*))?\}/g)) {
        const [, slot, feats] = m;
        let v = filler(slot, frame, ctx);
        if (v == null || v === '') { ok = false; break; }
        if (feats) { if (!inflect) { ok = false; break; } v = inflect(String(v), Object.fromEntries(feats.split(',').map((x) => x.split('=')))); }
        values[m[0]] = String(v);
      }
      if (ok) filled.push({ t, values });
    }
    if (!filled.length) return null;
    // one way to choose (std.decide, kind template): every slot filled, not said before, the more specific, then a seeded order
    const pick = choose(world, 'template', filled.map((x) => ({ ...x, unfilled: 0, used: used.has(x.t.id), specificity: x.t.slots.length || Object.keys(x.values).length })), { seed: Math.floor(rand() * 1e9) }).best;
    const { t, values } = pick;
    used.add(t.id);
    let text = t.text;
    for (const [k, v] of Object.entries(values)) text = text.split(k).join(v);
    if (dets.size) text = text.replace(/\b(a|an) (\S+)/gi, (m, a, next) => (dets.has(a.toLowerCase()) ? `${articleFor(world, next, { types: { det: `${lang}.det`, onset: `${lang}.onset` } }) ?? a} ${next}` : m)); // the article takes its form from the next word
    text = text.charAt(0).toUpperCase() + text.slice(1);
    return { text, template: t.id };
  };
}
