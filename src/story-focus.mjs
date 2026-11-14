// A story then a question (abstraction round item 6; reviewer 18:20 item 1): the referents of a
// story and its arithmetic frame stay in focus, and a following question is read against them. The
// story's sentences change quantities held by owners: an owner (a name, or a pronoun for the last
// one), a number and an item, and a verb whose effect is data (`verbs`: word -> set | add | remove
// | give). A question asks how many of an item an owner holds, or all of them together.
// Language-free: the verbs, number words, pronouns and question words come from the host or its
// language world.

const lemma = (w) => w.replace(/ies$/, 'y').replace(/(?<=[^s])s$/, '');

/**
 * Reads a story and answers its questions: { state: { owner: { item: n } }, steps, answers:
 * [{ question, answer, owner?, item, why }], unread: [sentences] }. Options: `verbs` { word: effect },
 * `numbers` { word: n }, `pronouns` [words], `question` [words that open a question], `all` [words
 * meaning together], `skip` [words passed over].
 */
export function storyState(text, { verbs = {}, numbers = {}, pronouns = [], question = [], all = [], skip = [] } = {}) {
  const V = Object.fromEntries(Object.entries(verbs).map(([k, v]) => [k.toLowerCase(), v]));
  const P = new Set(pronouns.map((x) => x.toLowerCase())), Q = new Set(question.map((x) => x.toLowerCase())), ALL = new Set(all.map((x) => x.toLowerCase())), S = new Set(skip.map((x) => x.toLowerCase()));
  const state = {}, steps = [], answers = [], unread = [];
  let last = null, lastItem = null;
  const hold = (o, i) => ((state[o] ||= {})[i] ??= 0);
  for (const raw of String(text).match(/[^.?!]+[.?!]?/g) || []) { // bounded: the sentences
    const sent = raw.trim(); if (!sent) continue;
    const toks = sent.match(/[\p{L}\p{N}'-]+/gu) || [];
    const isQ = sent.endsWith('?') || Q.has(toks[0]?.toLowerCase());
    const names = toks.filter((t, i) => /^\p{Lu}/u.test(t) && (i > 0 || !Q.has(t.toLowerCase()) && !P.has(t.toLowerCase()) && !V[t.toLowerCase()]));
    const owner = names[0] ?? (toks.some((t) => P.has(t.toLowerCase())) ? last : null);
    const numAt = toks.findIndex((t) => /^\d+$/.test(t) || numbers[t.toLowerCase()] !== undefined);
    const n = numAt >= 0 ? (/^\d+$/.test(toks[numAt]) ? Number(toks[numAt]) : numbers[toks[numAt].toLowerCase()]) : null;
    const itemTok = numAt >= 0 ? toks.slice(numAt + 1).find((t) => !S.has(t.toLowerCase()) && !/^\p{Lu}/u.test(t)) : null;
    const item = itemTok ? lemma(itemTok.toLowerCase()) : lastItem;
    if (isQ) {
      const many = toks.findIndex((t) => Q.has(t.toLowerCase()));
      const qItemTok = toks.slice(many + 1).find((t) => !Q.has(t.toLowerCase()) && !S.has(t.toLowerCase()) && !/^\p{Lu}/u.test(t) && !V[t.toLowerCase()] && !P.has(t.toLowerCase()) && !ALL.has(t.toLowerCase()));
      const qItem = qItemTok ? lemma(qItemTok.toLowerCase()) : lastItem;
      const together = toks.some((t) => ALL.has(t.toLowerCase())) || (!owner && !names.length);
      if (together) { const sum = Object.values(state).reduce((s, h) => s + (h[qItem] ?? 0), 0); answers.push({ question: sent, answer: sum, item: qItem, why: `the ${qItem} of ${Object.keys(state).join(', ')} together` }); }
      else if (owner && state[owner]) answers.push({ question: sent, answer: state[owner][qItem] ?? 0, owner, item: qItem, why: `what ${owner} holds after ${steps.filter((s) => s.owner === owner || s.to === owner).length} steps` });
      else answers.push({ question: sent, answer: null, item: qItem, why: 'no owner in focus' });
      continue;
    }
    const verb = toks.map((t) => t.toLowerCase()).find((t) => V[t]);
    if (!owner || n === null || !item || !verb) { unread.push(sent); continue; }
    const effect = V[verb];
    hold(owner, item);
    if (effect === 'set') state[owner][item] = n;
    else if (effect === 'add') state[owner][item] += n;
    else if (effect === 'remove') state[owner][item] -= n;
    else if (effect === 'give') { const to = names.find((x) => x !== owner); state[owner][item] -= n; if (to) { hold(to, item); state[to][item] += n; } steps.push({ owner, verb, n, item, ...(to ? { to } : {}) }); last = owner; lastItem = item; continue; }
    steps.push({ owner, verb, n, item });
    last = owner; lastItem = item;
  }
  return { state, steps, answers, unread };
}
