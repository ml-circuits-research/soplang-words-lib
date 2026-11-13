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
  // graded fallback: one question; or not here but there; or the best guess, named
  const missing = tried.find((t) => t.status === 'missing');
  if (missing) {
    const m = missing.missing[0];
    return { status: 'ask', reading: missing.index, question: m.ask || `What ${m.key}?`, missing: missing.missing, dropped: tried };
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
  return { status: 'unknown', reading: best.index, guess: req, question: `Did you mean to ${whatOf(req)}? (${why})`, dropped: tried };
}
