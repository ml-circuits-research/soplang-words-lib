// The dialogue (Round 28 item 3, from a host's lessons): the kind of each turn, from cue
// phrases the host names and from the act words of the world, so a host keeps no turn-kind
// code of its own. Language-free: the cues are facts (`std.dialogue.cue kind= text=`, or a
// language world's types mapped in `options.cues`), the act words come from the matrix.
//
// Kinds: `why` (a why-question about the last act), `correction` (it replaces the last act:
// "no wait, a blue one"), `continuation` (it adds to the last act: "and also ..."),
// `list` (several things and no act: the items of the last act's kind), `ellipsis` (a thing
// and no act: the last act again, on it), `answer` (a reply to the question the world asked),
// `request` (an act of its own). A world declared modal and active
// (`std.dialogue.modal world= active=true`) sees the turn first: it is named in `first`.
// In the literature: resolveEllipsis is ellipsis and fragment resolution (Fernández, Ginzburg and Lappin 2007); docs/literature.md.
import { actWords } from './segment.mjs';
import { typedLexicon } from './readtypes.mjs';

const as = (kind, o) => ({ kind, ...o }); // a turn kind (not a violation)
const unq = (t) => String(t).replace(/^"|"$/g, '').replace(/_/g, ' ').toLowerCase();

/**
 * The kind of one turn: { kind, rest, cue?, act?, first? }. `rest` is the text after the cue
 * phrase; `act` is the action carried over (ellipsis, list, correction) from `options.last`
 * (the last request, `{ action, args }`). Options: `cues` ({ kind: type }, a language world's
 * facts with `text`), `acts` (more act words), `last`, `asked` (the world asked a question).
 */
export function dialogueTurn(world, text, { cues = {}, acts = [], last, asked = false } = {}) {
  const tok = String(text).toLowerCase().match(/[\p{L}\p{N}]+(?:'[\p{L}]+)?|[,;?]/gu) || [];
  const phrases = []; // [{ kind, words }], longest first
  for (const c of world.ofType('std.dialogue.cue')) for (const t of c.attrs.text || []) phrases.push({ kind: c.attrs.kind[0], words: unq(t).split(/\s+/) });
  for (const [kind, type] of Object.entries(cues)) for (const c of world.ofType(type)) for (const t of c.attrs.text || []) phrases.push({ kind, words: unq(t).split(/\s+/) });
  phrases.sort((a, b) => b.words.length - a.words.length);
  const modal = world.ofType('std.dialogue.modal').filter((m) => m.attrs.active?.[0] !== 'false').map((m) => m.attrs.world[0]);
  const first = modal.length ? { first: modal[0] } : {};
  const lead = phrases.find((p) => p.words.every((w, k) => tok[k] === w));
  let rest = lead ? tok.slice(lead.words.length) : tok;
  while (rest[0] === ',') rest = rest.slice(1); // bounded: the tokens
  const restText = rest.join(' ').replace(/ ([,;?])/g, '$1');
  const verbs = actWords(world, acts);
  const hasAct = rest.some((w) => verbs.has(w));
  const carry = last?.action ? { act: last.action } : {};
  if (lead?.kind === 'why') return as('why', { rest: restText, cue: lead.words.join(' '), ...carry, ...first });
  if (lead?.kind === 'correction') return as('correction', { rest: restText, cue: lead.words.join(' '), ...(hasAct ? {} : carry), ...first });
  if (lead?.kind === 'continuation') return as('continuation', { rest: restText, cue: lead.words.join(' '), ...first });
  if (asked && (lead?.kind === 'answer' || !hasAct)) return as('answer', { rest: restText, ...(lead ? { cue: lead.words.join(' ') } : {}), ...first });
  if (hasAct) return as('request', { rest: restText, ...first });
  if (!rest.length) return as('request', { rest: '', ...first });
  const parts = restText.split(/,|\band\b/).map((x) => x.trim()).filter(Boolean);
  if (parts.length > 1 && last?.action) return as('list', { rest: restText, items: parts, ...carry, ...first });
  return last?.action ? as('ellipsis', { rest: restText, ...carry, ...first }) : as('request', { rest: restText, ...first });
}

/** The focus log: what each turn of a dialogue mentions, in order: [{ turn, in, pos, mentions: [{ kind, value }] }]. */
export function focusLog(world, dialogue) {
  const turns = world.ofType('std.focus.turn').filter((t) => dialogue === undefined || t.attrs.in?.[0] === dialogue);
  return turns.map((t) => ({ turn: unq(t.attrs.of[0]).replace(/^\$/, ''), in: t.attrs.in?.[0], pos: Number(t.attrs.pos?.[0] ?? 0),
    mentions: world.ofType('std.focus.mention').filter((m) => m.attrs.of[0] === t.attrs.of[0]).map((m) => ({ kind: m.attrs.kind[0], value: m.attrs.value[0] })) }))
    .sort((a, b) => a.pos - b.pos);
}

/**
 * Ellipsis (fragment) resolution:
 * Discourse ellipsis (reviewer 03:20, a verbless continuation: "it to the top right", "and still up"): when a
 * message names no act, the previous act is reused with the roles the message gives, read by type: a thing by
 * its name (a pronoun in `pronouns` keeps the previous thing), a value of a closed set by its key.
 * Relative continuations (reviewer 08:15, from real turns: "more to the left", "a bit lower", "not the first
 * one, the middle one"): a direction of the language world (`<lang>.lex name=acts.dir item=...`) goes in
 * `args[dirKey]`; a word of `more` marks the move as relative (`relative: { more: true, small?: true }` for a
 * word of `small`); a position among the things of the previous thing's type, ordered by `x` (an ordinal of
 * `<lang>.ordinal text= value=`, or a word of `positions`: first, last, middle), picks the thing, and a
 * clause with a negation (`<lang>.neg text=`) is the one rejected. Returns { act, args, reused: true,
 * changed: [keys], relative? }, or null when the message names an act or gives no role.
 * `previous`: { act, args }. Options: `pronouns`, `skip`, `lang` ('w.lang.en'), `dirKey` ('dir'), `more`,
 * `small`, `positions` ({ word: 1 | -1 | 'middle' }), `fold(word)` (a language's spelling folds).
 */
export function resolveEllipsis(world, text, previous, { pronouns = ['it', 'them', 'that', 'this'], skip = [], lang = 'w.lang.en', dirKey = 'dir', more = ['more', 'further', 'even', 'again', 'still'], small = ['bit', 'little', 'slightly'], positions = { first: 1, last: -1, middle: 'middle', centre: 'middle', center: 'middle' }, fold = (x) => x } = {}) {
  if (!previous?.act) return null;
  const lex = typedLexicon(world), S = new Set(skip.map((x) => fold(x.toLowerCase()))), P = new Set(pronouns.map((x) => x.toLowerCase()));
  const bare = (v) => String(v ?? '').replace(/^"|"$/g, '');
  const clauses = String(text).toLowerCase().split(/[,;]+/).map((c) => (c.match(/[\p{L}\p{N}_'-]+/gu) || []).map(fold).filter((t) => !S.has(t))).filter((c) => c.length);
  const negs = new Set(world.ofType(`${lang}.neg`).flatMap((n) => (n.attrs.text || []).map((t) => fold(bare(t)))));
  const kept = clauses.length > 1 ? clauses.filter((c) => !c.some((t) => negs.has(t))) : clauses; // "not the first one, the middle one": the clause without a negation
  const toks = (kept.length ? kept : clauses).flat();
  const sensesOf = (t) => lex.get(t) || lex.get(t.replace(/s$/, '')) || [];
  if (toks.some((t) => sensesOf(t).some((s) => s.cat === 'act'))) return null; // it names an act: not an ellipsis
  const args = { ...previous.args }, changed = [], relative = {};
  const dirs = world.ofType(`${lang}.lex`).filter((x) => bare(x.attrs.name?.[0]) === 'acts.dir').flatMap((x) => (x.attrs.item || []).map((i) => bare(i).toLowerCase().split(/\s+/).map(fold))).sort((a, b) => b.length - a.length);
  const ords = new Map([...Object.entries(positions).map(([k, v]) => [fold(k), v]), ...world.ofType(`${lang}.ordinal`).map((o) => [fold(bare(o.attrs.text[0])), Number(bare(o.attrs.value[0]))])]);
  const M = new Set(more.map(fold)), SM = new Set(small.map(fold));
  for (let i = 0; i < toks.length; i++) { // bounded: the tokens
    const t = toks[i];
    if (P.has(t)) continue; // the previous thing stays
    const dir = dirs.find((d) => d.every((x, j) => toks[i + j] === x));
    if (dir) { args[dirKey] = dir.join(' '); changed.push(dirKey); i += dir.length - 1; continue; }
    if (M.has(t)) { relative.more = true; continue; }
    if (SM.has(t)) { relative.small = true; continue; }
    if (ords.has(t)) { // a position among the things of the previous thing's type
      const prev = previous.args?.thing !== undefined ? world.get(String(previous.args.thing).replace(/^\$/, '')) : null;
      const set = prev ? world.ofType(prev.type).slice().sort((a, b) => Number(bare(a.attrs.x?.[0] ?? 0)) - Number(bare(b.attrs.x?.[0] ?? 0))) : [];
      const p = ords.get(t), pick = p === 'middle' ? set[Math.floor((set.length - 1) / 2)] : p < 0 ? set[set.length + p] : set[p - 1];
      if (pick) { args.thing = pick.id; changed.push('thing'); }
      continue;
    }
    const multi = [3, 2].map((n) => toks.slice(i, i + n).join(' ')).find((p) => p.includes(' ') && sensesOf(p).length);
    const word = multi ?? t, ss = sensesOf(word);
    const thing = ss.find((s) => s.cat === 'thing'), value = ss.find((s) => s.cat === 'value' && s.schema);
    if (thing) { args.thing = thing.id; changed.push('thing'); }
    else if (value) { args[value.key] = word; changed.push(value.key); }
    if (multi) i += multi.split(' ').length - 1;
  }
  if (relative.more && !changed.length && previous.args?.[dirKey] !== undefined) changed.push(dirKey); // "even more": the same direction again
  if (!changed.length) return null;
  return { act: previous.act, args, reused: true, changed, ...(Object.keys(relative).length ? { relative } : {}) };
}
