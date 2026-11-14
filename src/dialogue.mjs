// The dialogue (Round 28 item 3, from PSys2's lessons): the kind of each turn, from cue
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
import { actWords } from './segment.mjs';

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
