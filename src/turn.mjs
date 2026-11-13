// One request pipeline (Round 24, A3 and A4): the candidate readings of one message →
// a dry run of each (on a fork: nothing changes) → the first reading the world takes →
// applied as one sentence (all or nothing, one undo step) → its difference, the why of
// each changed value and the reply data. When no reading is taken, a graded fallback: a
// reading that only lacks something asks one question; an act that is not possible here
// says where it is; otherwise the best guess is named with one question. The host reads
// text into readings and renders the replies; nothing here knows a language beyond the
// plain-English reply of actReply, which `reply` replaces.

import { actReply } from './schema-words.mjs';

const asList = (r) => (Array.isArray(r) ? r : r?.requests ? r.requests : [r]);
const whatOf = (req) => `${req.action}${req.args?.kind ? ` ${req.args.kind}` : req.args?.thing ? ` ${String(req.args.thing).replace(/^\$/, '')}` : ''}`;

/**
 * @param {import('./world.mjs').World} world
 * @param {Array} readings each a request `{ action, args }`, a list of them (one sentence), or `{ requests }`; best first
 * @param {{ reply?: (world, request, result) => string }} options
 */
export function turn(world, readings, { reply = actReply } = {}) {
  const tried = [];
  for (let i = 0; i < readings.length; i++) { // bounded: the readings given
    const reqs = asList(readings[i]);
    const r = world.fork().act(reqs); // a dry run: the fork is thrown away
    tried.push({ index: i, requests: reqs, ok: r.ok, status: r.status, failed: r.failed, missing: r.missing, violation: r.violations?.[0] });
    if (r.ok) {
      const done = world.act(reqs);
      if (!done.ok) { tried[tried.length - 1] = { ...tried[tried.length - 1], ok: false, status: done.status, violation: done.violations?.[0] }; continue; } // the world changed in between
      const results = done.results;
      const changed = results.flatMap((x) => x.diff?.changed || []);
      const why = changed.filter((c) => world.has(c.id)).map((c) => ({ id: c.id, key: c.key, steps: world.why(c.id, c.key)?.steps || [] }));
      const guesses = results.flatMap((x) => x.result?.filled || []).map((f) => ({ ...f }));
      const replies = results.map((x, j) => reply(world, reqs[j], x));
      if (guesses.length) replies.push(`I guessed ${guesses.map((g) => `${g.key} ${g.value} (${g.tier}${g.source ? `, ${g.source}` : ''})`).join(', ')}.`);
      return { status: 'done', reading: i, results, diff: { added: results.flatMap((x) => x.diff?.added || []), removed: results.flatMap((x) => x.diff?.removed || []), changed }, why, guesses, replies, dropped: tried.slice(0, -1) };
    }
  }
  return fallbackOf(world, tried, reply);
}


/** The graded fallback when no reading was taken: one question; or not here but there; or the best guess, named. */
export function fallbackOf(world, tried, reply = actReply) {
  const missing = tried.find((t) => t.status === 'missing');
  if (missing) {
    const m = missing.missing[0];
    const question = m.ask || `What ${m.key}?`;
    return { status: 'ask', reading: missing.index, question, replies: [question], missing: missing.missing, dropped: tried };
  }
  const elsewhere = tried.find((t) => { const r = t.violation?.reason; return r && (r.hasIt?.length || (r.allowed?.length && !r.allowed.includes(r.act) && r.elsewhere?.length)); }); // the kind is known here: say what it can do and where the act is
  if (elsewhere) {
    const req = elsewhere.requests[elsewhere.failed ?? 0];
    const res = { ok: false, status: 'refused', violations: [elsewhere.violation] };
    return { status: 'elsewhere', reading: elsewhere.index, reason: elsewhere.violation.reason, replies: [reply(world, req, res)], dropped: tried };
  }
  const best = tried[0];
  if (!best) return { status: 'nothing', replies: [], dropped: [] };
  const req = best.requests[best.failed ?? 0];
  const why = best.violation?.why ? String(best.violation.why).replace(/^"|"$/g, '') : 'it was refused';
  const question = `Did you mean to ${whatOf(req)}? (${why})`;
  return { status: 'unknown', reading: best.index, guess: req, question, replies: [question], dropped: tried };
}

/**
 * Choosing the world for a request (Round 24, A2): every world of the schemas is scored
 * by what it knows about the request — its card has the kind (or takes any kind of a
 * catalog), it allows the act, the thing named is one of its things — and by a dry run
 * (a world where the act would be refused loses); the host may add its own signal per
 * world (`scores`, an encoder's for instance). Best first: [{ world, score, why }].
 */
export function route(world, request, { scores = {} } = {}) {
  const args = request.args || {};
  const kindName = args.kind ?? null;
  const thingId = args.thing !== undefined ? String(args.thing).replace(/^\$/, '') : null;
  const thing = thingId ? world.get(thingId) : null;
  const kind = kindName ?? thing?.attrs.kind?.[0] ?? thingId;
  const out = [];
  for (const wd of world.ofType('std.schema.world')) { // bounded: the declared worlds
    const name = wd.attrs.name[0], why = [];
    let score = 0;
    const decl = world.ofType('std.schema.kind').find((k) => k.attrs.of[0] === kind && k.attrs.world.includes(name));
    const open = !decl && world.ofType('std.schema.kinds').find((k) => k.attrs.world[0] === name && world.ofType(k.attrs.from[0]).some((x) => x.attrs[k.attrs.key?.[0] || 'name']?.includes(kind)));
    const k = decl || open;
    if (k) { score += 2; why.push(decl ? `has ${kind}` : `takes any ${k.attrs.from[0]}: ${kind}`); }
    if (k && (k.attrs.acts || []).includes(request.action)) { score += 1; why.push(`allows ${request.action}`); }
    if (thing?.attrs.world?.includes(name)) { score += 2; why.push(`${thing.id} is here`); }
    if (k) {
      const r = world.fork().act({ action: request.action, args: request.action === 'make' ? { ...args, world: name } : args });
      if (!r.ok) { score -= 2; why.push(`refused: ${String(r.violations?.[0]?.why ?? r.status).replace(/^"|"$/g, '')}`); }
    }
    if (scores[name] !== undefined) { score += Number(scores[name]); why.push(`host ${scores[name]}`); }
    out.push({ world: name, score, why });
  }
  return out.sort((a, b) => b.score - a.score || a.world.localeCompare(b.world));
}

/**
 * The request pipeline as data (Round 25): runs the stages a world declares with std.turn
 * (`core.use world=std.turn`): the order of the `after` chain, providers by tier, what an
 * empty stage does. The providers are functions `(ctx) => value | undefined`; the library
 * gives `given`, `dryrun`, `apply`, `reply`, `fallback`, `confirm`, `route`; the host adds
 * its own in `providers`. Fixed whatever is declared: apply is one sentence (one undo step,
 * all or nothing), each call keeps its budget, the same input and state give the same path,
 * and `trace` names every stage taken.
 */
export function turnFlow(world, readings, { providers = {}, reply = actReply, confirmed = false } = {}) {
  const stages = world.ofType('std.turn.stage').map((s) => ({ name: s.attrs.name[0], after: s.attrs.after?.[0], before: s.attrs.before?.[0], on: s.attrs.on_empty?.[0] ?? 'fail', per: s.attrs.per?.[0], when: s.attrs.when?.[0], skip: s.attrs.skip_if?.[0], only: s.attrs.only || null }));
  const provs = world.ofType('std.turn.provider').map((p) => ({ stage: p.attrs.stage[0], fn: p.attrs.name[0], tier: Number(p.attrs.tier?.[0] ?? 1) })).sort((a, b) => a.tier - b.tier || a.fn.localeCompare(b.fn));
  // the order: the after chain from the stage that follows nothing (ties by name: deterministic)
  const chain = [];
  const main = stages.filter((s) => !s.when && !s.before);
  let next = main.filter((s) => !s.after).sort((a, b) => a.name.localeCompare(b.name));
  while (next.length) { // bounded: each stage once
    for (const s of next) chain.push(s);
    const names = new Set(next.map((s) => s.name));
    next = main.filter((s) => names.has(s.after) && !chain.includes(s)).sort((a, b) => a.name.localeCompare(b.name));
  }
  for (const s of stages.filter((x) => x.before && !x.when).sort((a, b) => a.name.localeCompare(b.name))) { // a stage placed before another: right before it, with its kind
    const at = chain.findIndex((x) => x.name === s.before);
    if (at >= 0) chain.splice(at, 0, { ...s, per: s.per ?? chain[at].per });
  }
  const fns = { ...BUILTIN_PROVIDERS, ...providers };
  const trace = [];
  const ctx = { world, input: readings, readings: [], tried: [], say: reply, confirmed, out: {} }; // out: what each stage yielded
  const run = (stage) => { // the first provider of the stage that yields (a reader's candidates add up)
    if (stage.skip && (ctx.candidate?.some((r) => r.args?.[stage.skip] !== undefined) || ctx.out[stage.skip] !== undefined)) { trace.push({ stage: stage.name, skipped: stage.skip }); return true; }
    if (stage.only && ctx.candidate && !ctx.candidate.some((r) => stage.only.includes(r.action))) { trace.push({ stage: stage.name, skipped: 'only' }); return true; }
    const ps = provs.filter((p) => p.stage === stage.name);
    if (!ps.length) { trace.push({ stage: stage.name, empty: 'no provider' }); return false; }
    let yielded = false;
    for (const p of ps) { // bounded: the providers of one stage
      const f = fns[p.fn];
      if (!f) { trace.push({ stage: stage.name, provider: p.fn, empty: 'not registered' }); continue; }
      const v = f(ctx);
      if (v === undefined || v === null) { trace.push({ stage: stage.name, provider: p.fn, empty: ctx.why ?? 'nothing' }); ctx.why = undefined; continue; }
      if (stage.name === 'read' || p.fn === 'given' || Array.isArray(v) && stage.per !== 'candidate') { ctx.readings.push(...v); yielded = true; trace.push({ stage: stage.name, provider: p.fn, yielded: v.length }); continue; } // readers add up
      ctx.out[stage.name] = v; trace.push({ stage: stage.name, provider: p.fn, yielded: true }); return true;
    }
    return yielded;
  };
  const once = chain.filter((s) => s.per !== 'candidate'), per = chain.filter((s) => s.per === 'candidate');
  for (const s of once) if (!run(s)) return { status: 'nothing', replies: [], dropped: [], trace };
  for (let i = 0; i < ctx.readings.length; i++) { // bounded: the candidates read
    ctx.index = i;
    ctx.candidate = Array.isArray(ctx.readings[i]) ? ctx.readings[i] : ctx.readings[i]?.requests ?? [ctx.readings[i]];
    ctx.out = {};
    let ok = true;
    for (const s of per) {
      if (run(s)) continue;
      if (s.on === 'ask' && ctx.question) return { status: 'ask', reading: i, question: ctx.question, replies: [ctx.question], dropped: ctx.tried, trace };
      if (s.on === 'next') { ok = false; break; }
      return { status: 'failed', stage: s.name, reading: i, replies: [], dropped: ctx.tried, trace };
    }
    if (ok) return { ...ctx.out.reply, reading: i, dropped: ctx.tried, trace };
  }
  for (const s of stages.filter((x) => x.when === 'exhausted')) if (run(s)) return { ...ctx.out[s.name], trace };
  return { status: 'nothing', replies: [], dropped: ctx.tried, trace };
}

const BUILTIN_PROVIDERS = {
  given: (ctx) => ctx.input,
  dryrun: (ctx) => {
    const r = ctx.world.fork().act(ctx.candidate);
    ctx.tried.push({ index: ctx.index, requests: ctx.candidate, ok: r.ok, status: r.status, failed: r.failed, missing: r.missing, violation: r.violations?.[0] });
    if (r.ok) return r;
    ctx.why = String(r.violations?.[0]?.why ?? r.status).replace(/^"|"$/g, '');
    return undefined;
  },
  apply: (ctx) => { const r = ctx.world.act(ctx.candidate); if (!r.ok) { ctx.why = 'the world changed'; return undefined; } return r; },
  reply: (ctx) => {
    const done = ctx.out.apply, reqs = ctx.candidate, w = ctx.world;
    const results = done.results;
    const changed = results.flatMap((x) => x.diff?.changed || []);
    const why = changed.filter((c) => w.has(c.id)).map((c) => ({ id: c.id, key: c.key, steps: w.why(c.id, c.key)?.steps || [] }));
    const guesses = results.flatMap((x) => x.result?.filled || []).map((f) => ({ ...f }));
    const replies = results.map((x, j) => ctx.say(w, reqs[j], x));
    if (guesses.length) replies.push(`I guessed ${guesses.map((g) => `${g.key} ${g.value} (${g.tier}${g.source ? `, ${g.source}` : ''})`).join(', ')}.`);
    return { status: 'done', results, diff: { added: results.flatMap((x) => x.diff?.added || []), removed: results.flatMap((x) => x.diff?.removed || []), changed }, why, guesses, replies };
  },
  fallback: (ctx) => fallbackOf(ctx.world, ctx.tried, ctx.say),
  // a confirmation before an act on a whole set (remove each / all): asks unless confirmed
  confirm: (ctx) => {
    const many = ctx.candidate.find((r) => r.args?.set === 'each' || r.args?.set === 'all');
    if (!many || ctx.confirmed) return true;
    const n = ctx.out.dryrun?.results?.find((x) => x.result?.things)?.result.things.length;
    ctx.question = `${String(many.action)[0].toUpperCase()}${String(many.action).slice(1)} all ${n ?? ''} ${many.args.thing}${n === 1 ? '' : 's'}?`.replace(/  +/g, ' ');
    return undefined;
  },
  // the world for a candidate that names none: route's best, written into make
  route: (ctx) => { for (const r of ctx.candidate) if (r.action === 'make' && r.args && r.args.world === undefined) { const best = route(ctx.world, r)[0]; if (best && best.score > 0) r.args = { ...r.args, world: best.world }; } return true; },
};
