// The honest list (skills/HONEST-LIST.md): one row per real turn the system does not handle yet, each with the
// generic piece it needs. Rows are data (JSONL); this module reads, checks, ranks and derives them. It names no
// world, no sentence and no host: a row's turn is data, and `needs` must never repeat it.

/** The classes of generic pieces, in the order a missing piece is looked for (skills/README.md). */
export const PIECES = Object.freeze(['declaration', 'knowledge', 'language', 'composition', 'method', 'library', 'none', 'unknown']);
export const STAGES = Object.freeze(['reading', 'planning', 'acting', 'replying']);

/** Rows from JSONL text (blank lines and lines starting with // are skipped). */
export function readHonest(text) {
  return String(text).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//')).map((l) => JSON.parse(l));
}
export const writeHonest = (rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';

const words = (s) => String(s ?? '').toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
/** True when b repeats a run of at least n consecutive words of a (a "needs" that quotes its turn is a patch, not a piece). */
export function quotes(a, b, n = 3) {
  const A = words(a), B = ` ${words(b).join(' ')} `;
  for (let i = 0; i + n <= A.length; i++) if (B.includes(` ${A.slice(i, i + n).join(' ')} `)) return true;
  return false;
}

/** The problems of each row: a missing field, an unknown class, a "needs" that quotes its turn or names no piece. */
export function checkHonest(rows) {
  const problems = [];
  rows.forEach((r, i) => {
    const at = r.id ?? `row ${i + 1}`;
    for (const k of ['turn', 'stage', 'needs', 'piece']) if (r[k] == null || r[k] === '') problems.push({ at, why: `missing ${k}` });
    if (r.piece && !PIECES.includes(r.piece)) problems.push({ at, why: `piece "${r.piece}" is not one of ${PIECES.join(', ')}` });
    if (r.stage && !STAGES.includes(r.stage)) problems.push({ at, why: `stage "${r.stage}" is not one of ${STAGES.join(', ')}` });
    if (r.needs && !/^needs /.test(r.needs)) problems.push({ at, why: '"needs" must start with "needs "' });
    if (r.needs && r.turn && quotes(r.turn, r.needs)) problems.push({ at, why: '"needs" quotes the turn: name the generic piece, not the case' });
    if (r.piece === 'unknown' && !/^needs (a |an )?(generic )?(piece|method|idea)/.test(r.needs ?? '')) problems.push({ at, why: 'an unknown piece says so: "needs a generic piece (unknown): ..."' });
  });
  return problems;
}

/**
 * What to work on: the rows grouped by `needs`, ranked by the real turns the piece would unlock (distinct turns,
 * weighted by `seen`), then by the worlds it touches (more worlds: more generic), then by synthetic turns.
 * `piece: none` rows (a correct refusal) are not work and are left out unless `all`.
 */
export function rankNeeds(rows, { all = false } = {}) {
  const groups = new Map();
  for (const r of rows) {
    if (!all && r.piece === 'none') continue;
    const g = groups.get(r.needs) ?? { needs: r.needs, piece: r.piece, real: 0, synthetic: 0, turns: new Set(), worlds: new Set(), ids: [] };
    if (!g.turns.has(r.turn)) { g.turns.add(r.turn); if (r.real === false) g.synthetic++; else g.real += Number(r.seen ?? 1); }
    if (r.world) g.worlds.add(r.world);
    if (r.id) g.ids.push(r.id);
    groups.set(r.needs, g);
  }
  return [...groups.values()].map((g) => ({ ...g, turns: g.turns.size, worlds: [...g.worlds] }))
    .sort((a, b) => b.real - a.real || b.worlds.length - a.worlds.length || b.synthetic - a.synthetic || a.needs.localeCompare(b.needs));
}

/** The change of the list between two snapshots: rows that left (by turn), rows that came, by piece. */
export function honestDelta(before, after) {
  const key = (r) => `${r.world ?? ''}|${r.turn}`;
  const A = new Map(before.map((r) => [key(r), r])), B = new Map(after.map((r) => [key(r), r]));
  return { left: [...A.values()].filter((r) => !B.has(key(r))), came: [...B.values()].filter((r) => !A.has(key(r))), before: A.size, after: B.size };
}

/**
 * Triage of one turn by the evidence the request architecture already carries (readRequest's `unread` and `spell`,
 * planRequest's `notHonoured` codes, `cannot` and `rejected`): the stage and the generic piece it points to. Returns
 * [] when the turn left nothing unread, unnamed or refused. A named refusal of something the world does not declare
 * is `piece: none` (correct behaviour) unless the user expected it, which only the host's row can say (`expected`).
 */
export function triage(request, plan, { expected = false } = {}) {
  const out = [];
  const row = (stage, piece, needs, evidence) => out.push({ stage, piece, needs, evidence });
  if (request?.unread?.length) {
    if (!request.act && !plan?.act) row('reading', 'language', 'needs the act word: a verb of k.actions or a word of the world\'s action in the language world (else an honest "I cannot do that")', `unread at the act: ${request.unread.length} word(s)`);
    else row('reading', 'language', 'needs a reading for an unread content word: a cue, kind word or value word in the language world, or a kind or value the declared worlds lack', `unread: ${request.unread.length} word(s)`);
  }
  for (const a of request?.spell?.asks ?? []) row('reading', 'library', 'needs a disambiguation between near words: the dialogue or the world\'s state as a prior (repairWords), or a question back', `spell ask with ${a.candidates?.length ?? 0} candidates`);
  for (const n of plan?.notHonoured ?? []) {
    if (n.code === 'not_declared') row('planning', expected ? 'declaration' : 'none', expected ? `needs std.schema.honours on=${n.on} for the act, with a slot that takes it` : `needs nothing: a named refusal of ${n.on}, which the world does not declare`, n.why);
    else if (n.code === 'no_slot') row('planning', 'declaration', `needs a slot for ${n.on} on the kinds made (the world honours it but nothing takes it)`, n.why);
    else if (n.code === 'value') row('planning', 'knowledge', `needs the value in the slot's domain: a join to a knowledge type by key instead of an enum, or a named refusal`, n.why);
    else if (n.code === 'no_kind') row('planning', 'composition', 'needs the kind: a declaration in this world, or an explicit composition with a world that has it', n.why);
    else if (n.code === 'nothing_left') row('planning', 'none', 'needs nothing: exclusions that leave nothing are named', n.why);
  }
  if (plan && !plan.ok && plan.cannot?.length) row('planning', expected ? 'method' : 'none', expected ? 'needs a planning method that finds a satisfiable alternative (more candidates, plan repair) or a better reason' : 'needs nothing: a refusal with its reason', plan.cannot.map((c) => c.why).join('; '));
  return out;
}

/**
 * The acceptance rule of a change, in two phases (owner 2026-11-15; skills/README.md "Acceptance").
 * - `transition` (patches are still being replaced by generic mechanisms): a lost case that was won only by a patch
 *   (`patchOnly: true`) does not count; any other loss is listed on the honest list with its "needs".
 * - `steady` (the patches are gone): a regression needs very good arguments; losses are accepted only for a large
 *   gain, at least `ratio` (10) won per lost, net and on real turns, each loss listed as "needs <generic piece>".
 * `won` / `lost`: `[{ turn, real?, patchOnly?, needs? }]`. Counts are reported, never a gate by themselves: the
 * gate is this rule plus the generated properties and the fresh probes. Returns `{ accept, why, counted, listed }`.
 */
export function acceptance(phase, { won = [], lost = [] } = {}, { ratio = 10 } = {}) {
  const real = (xs) => xs.filter((x) => x.real !== false);
  const counted = phase === 'transition' ? lost.filter((x) => !x.patchOnly) : lost;
  const unlisted = counted.filter((x) => !x.needs || !/^needs /.test(x.needs));
  const W = real(won).length, L = real(counted).length;
  if (unlisted.length) return { accept: false, why: `${unlisted.length} lost case(s) not listed with "needs <generic piece>"`, counted, listed: counted.length - unlisted.length };
  if (phase === 'transition') return { accept: true, why: `transition: ${lost.length - counted.length} patch-only loss(es) ignored, ${counted.length} listed; won ${won.length} (real ${W})`, counted, listed: counted.length };
  if (!L) return { accept: true, why: `steady: nothing lost; won ${won.length} (real ${W})`, counted, listed: 0 };
  const ok = W - L > 0 && W >= ratio * L;
  return { accept: ok, why: `steady: real won ${W}, lost ${L} (need at least ${ratio} won per lost, net positive)${ok ? '' : ': a regression needs a larger gain or a very good argument written in the log'}`, counted, listed: counted.length };
}

/**
 * Whether a won case is patch-only. The test is to switch the patches off (the legacy path, the case-fitted rules)
 * and run the case on the generic path alone: `passesWithout === false` means no generic mechanism wins it. When that
 * run is not possible, the piece that wins it decides: it is patch-only when it has smells (smellsOf non-empty).
 */
export const patchOnly = ({ passesWithout, smells = [] }) => passesWithout === false || (passesWithout == null && smells.length > 0);
