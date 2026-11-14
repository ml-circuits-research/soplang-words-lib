// A story then a question (abstraction round item 6; reviewer 18:20 item 1): the referents of a
// story and its arithmetic frame stay in focus, and a following question is read against them. The
// story's sentences change quantities held by owners: an owner (a name, or a pronoun for the last
// one), a number and an item, and a verb whose effect is data (`verbs`: word -> set | add | remove
// | give). A question asks how many of an item an owner holds, or all of them together.
// Language-free: the verbs, number words, pronouns and question words come from the host or its
// language world.

const lemma = (w) => w.replace(/ies$/, 'y').replace(/(?<=[^s])s$/, '');

/**
 * Reads a story and answers its questions: { state: { owner: { item: n } }, steps, answers: [{ question,
 * answer, owner?, item, why }], refused: [{ sentence, why }], unread: [sentences], focus, starts }.
 * Each sentence changes what an owner holds: the subject is a name, a pronoun (the last owner), a word of
 * `self` (I, me: the owner "I"), or a number ("One flies away": that many of the last item, of the last
 * owner). A number, or a word of `one` (a, an) for 1, then the item; the verb's effect is data (`verbs`:
 * word -> set | add | remove | give; a give moves the quantity to the other name). A sentence with a
 * negation changes nothing; giving or losing more than is held is refused, with the reason ("Tom only had
 * 5"). A change before anything is known makes the start unknown, solved by a later "has" ("ate 2 and now
 * has 3": 5 at first). A comparison sets one owner's quantity from another's ("3 more than", "2 fewer
 * than", "twice as many as"). Questions: how many an owner holds (or all together), how many at first
 * (`start` words), how many more or fewer one holds than another, who holds the most or the least.
 * `prior` (an earlier result) carries a story across turns. Options: `verbs`, `numbers`, `pronouns`,
 * `question`, `all`, `skip`, `self`, `one`, `negations`, `more`, `fewer`, `times` ({ word: factor }),
 * `than`, `start`, `most`, `least`.
 */
export function storyState(text, { verbs = {}, numbers = {}, pronouns = [], question = [], all = [], skip = [], self = ['i', 'me'], one = ['a', 'an'], negations = ['not', 'never', "didn't", "doesn't", "don't", 'didnt', 'doesnt', 'dont'], more = ['more'], fewer = ['fewer', 'less'], times = { twice: 2, double: 2, thrice: 3, triple: 3 }, than = ['than'], start = ['first', 'start', 'beginning', 'begin', 'began'], most = ['most'], least = ['least', 'fewest'], prior } = {}) {
  const low = (x) => String(x).toLowerCase();
  const set = (xs) => new Set(xs.map(low));
  const V = Object.fromEntries(Object.entries(verbs).map(([k, v]) => [low(k), v])), N = Object.fromEntries(Object.entries(numbers).map(([k, v]) => [low(k), v]));
  const P = set(pronouns), Q = set(question), ALL = set(all), S = set(skip), SELF = set(self), ONE = set(one), NEG = set(negations), MORE = set(more), FEWER = set(fewer), THAN = set(than), START = set(start), MOST = set(most), LEAST = set(least);
  const TIMES = Object.fromEntries(Object.entries(times).map(([k, v]) => [low(k), v]));
  const state = JSON.parse(JSON.stringify(prior?.state ?? {})), starts = { ...(prior?.starts ?? {}) }, unknown = { ...(prior?.unknown ?? {}) };
  const steps = [...(prior?.steps ?? [])], answers = [], unread = [], refused = [];
  let last = prior?.focus?.owner ?? null, lastItem = prior?.focus?.item ?? null;
  const key = (o, i) => `${o}|${i}`;
  const known = (o, i) => state[o]?.[i] !== undefined && !unknown[key(o, i)];
  const touch = (o, i) => { // a change before anything is known: the start is unknown, the change kept as an offset
    state[o] ||= {};
    if (state[o][i] === undefined) { state[o][i] = 0; unknown[key(o, i)] = true; }
  };
  const numOf = (t) => (/^\d+(\.\d+)?$/.test(t) ? Number(t) : N[low(t)]);
  const isName = (t, i) => /^\p{Lu}/u.test(t) && !Q.has(low(t)) && !P.has(low(t)) && !SELF.has(low(t)) && !V[low(t)] && numOf(t) === undefined && !(i === 0 && (S.has(low(t)) || NEG.has(low(t))));
  const itemAfter = (toks, at) => { const t = toks.slice(at + 1).find((x) => !S.has(low(x)) && !/^\p{Lu}/u.test(x) && !V[low(x)] && !THAN.has(low(x)) && !MORE.has(low(x)) && !FEWER.has(low(x)) && !MOST.has(low(x)) && !LEAST.has(low(x)) && TIMES[low(x)] === undefined && numOf(x) === undefined && !P.has(low(x)) && !SELF.has(low(x)) && !Q.has(low(x)) && !ALL.has(low(x)) && !NEG.has(low(x))); return t ? lemma(low(t)) : null; };
  const clauses = []; // sentences, and a sentence cut at "and" when both sides have a verb ("ate 2 and now has 3")
  for (const raw of String(text).match(/[^.?!]+[.?!]?/g) || []) {
    const sent = raw.trim(); if (!sent) continue;
    const parts = sent.split(/,?\s+and\s+/i);
    if (parts.length > 1 && !sent.endsWith('?') && parts.every((x) => (x.match(/[\p{L}'-]+/gu) || []).some((t) => V[low(t)]))) clauses.push(...parts.map((x, i) => (i < parts.length - 1 ? `${x}.` : x))); else clauses.push(sent);
  }
  const plural = (n, item) => `${n} ${item}${n === 1 ? '' : /(s|x|ch|sh)$/.test(item) ? 'es' : 's'}`;
  for (const sent of clauses) { // bounded: the clauses
    const toks = sent.match(/[\p{L}\p{N}'.-]+/gu)?.map((t) => t.replace(/\.$/, '')) || [];
    const L = toks.map(low);
    const isQ = sent.endsWith('?') || Q.has(L[0]) || L[0] === 'who';
    const names = toks.filter((t, i) => isName(t, i));
    const subjSelf = L.some((t) => SELF.has(t));
    if (isQ) {
      const qOwner = names[0] ?? (L.some((t) => P.has(t)) ? last : subjSelf ? 'I' : null);
      const many = Math.max(L.findIndex((t) => Q.has(t)), L.indexOf('who'));
      const qItem = itemAfter(toks, many) ?? lastItem;
      const val = (o) => (unknown[key(o, qItem)] ? null : state[o]?.[qItem] ?? 0);
      if (L.includes('who') && (L.some((t) => MOST.has(t)) || L.some((t) => LEAST.has(t)))) {
        const owners = Object.keys(state).filter((o) => state[o][qItem] !== undefined && !unknown[key(o, qItem)]);
        const pick = owners.sort((a, b) => (L.some((t) => MOST.has(t)) ? val(b) - val(a) : val(a) - val(b)))[0];
        answers.push({ question: sent, answer: pick ?? null, item: qItem, why: pick ? `${owners.map((o) => `${o} ${val(o)}`).join(', ')}` : `no one holds ${qItem}` });
      } else if ((L.some((t) => MORE.has(t)) || L.some((t) => FEWER.has(t))) && names.length >= 2) { // how many more does A have than B
        const [a, b] = names, d = val(a) - val(b);
        answers.push({ question: sent, answer: L.some((t) => FEWER.has(t)) ? -d : d, owner: a, item: qItem, why: `${a} ${val(a)}, ${b} ${val(b)}` });
      } else if (L.some((t) => START.has(t)) && qOwner) {
        const st = starts[key(qOwner, qItem)];
        answers.push({ question: sent, answer: st ?? null, owner: qOwner, item: qItem, why: st !== undefined ? `what ${qOwner} held before the story's changes` : 'the start is not known' });
      } else if (L.some((t) => ALL.has(t)) || (!qOwner && !names.length)) {
        const sum = Object.keys(state).reduce((t, o) => t + (val(o) ?? 0), 0);
        answers.push({ question: sent, answer: sum, item: qItem, why: `the ${qItem} of ${Object.keys(state).join(', ')} together` });
      } else if (qOwner && state[qOwner]) {
        const v = val(qOwner);
        answers.push({ question: sent, answer: v, owner: qOwner, item: qItem, why: v === null ? `${qOwner} started with an unknown number` : `what ${qOwner} holds after ${steps.filter((x) => x.owner === qOwner || x.to === qOwner).length} steps${refused.length ? `; ${refused.map((r) => r.why).join('; ')}` : ''}` });
      } else answers.push({ question: sent, answer: null, item: qItem, why: 'no owner in focus' });
      if (qOwner) last = qOwner;
      continue;
    }
    // the subject: a name, a pronoun, I, or a number ("One flies away")
    const numAt = L.findIndex((t, i) => numOf(toks[i]) !== undefined || (ONE.has(t) && i > 0));
    const numSubject = numAt === 0 && numOf(toks[0]) !== undefined;
    const owner = numSubject ? last : names[0] && L.indexOf(low(names[0])) <= (L.findIndex((t) => V[t]) + 1 || 99) ? names[0] : L.some((t) => P.has(t)) ? last : subjSelf ? 'I' : names[0] ?? (V[L[0]] || S.has(L[0]) ? last : null); // no subject ("and now has 3"): the last owner
    const n = numAt >= 0 ? (numOf(toks[numAt]) ?? 1) : null;
    const item = numSubject ? (V[L[1]] ? lastItem : itemAfter(toks, 0) ?? lastItem) : numAt >= 0 ? itemAfter(toks, numAt) ?? lastItem : lastItem;
    const verb = L.find((t) => V[t]);
    const cmpFactor = L.map((t) => TIMES[t]).find((x) => x !== undefined);
    if (!owner || (n === null && cmpFactor === undefined) || !item || !verb) { unread.push(sent); continue; }
    if (L.some((t) => NEG.has(t) || t.endsWith("n't"))) { steps.push({ owner, verb, n, item, negated: true }); last = owner; lastItem = item; continue; } // it did not happen: nothing changes
    const effect = V[verb];
    const other = names.find((x) => x !== owner);
    const cmp = L.some((t) => THAN.has(t)) || (L.includes('as') && L.includes('many'));
    if (cmp && other && effect === 'set') { // a comparison: this owner's quantity from the other's
      const factor = cmpFactor;
      const base = state[other]?.[item] ?? 0;
      const v = factor !== undefined ? base * factor : L.some((t) => FEWER.has(t)) ? base - n : base + n;
      (state[owner] ||= {})[item] = v; delete unknown[key(owner, item)];
      steps.push({ owner, verb, item, from: other, value: v });
      last = owner; lastItem = item; continue;
    }
    if (effect === 'set') {
      if (unknown[key(owner, item)]) { starts[key(owner, item)] = n - state[owner][item]; delete unknown[key(owner, item)]; } // "and now has 3": the start solved
      (state[owner] ||= {})[item] = n;
      if (starts[key(owner, item)] === undefined && !steps.some((x) => x.owner === owner && x.item === item)) starts[key(owner, item)] = n;
    } else {
      touch(owner, item);
      if ((effect === 'remove' || effect === 'give') && known(owner, item) && state[owner][item] < n) { refused.push({ sentence: sent, why: `${owner} only had ${plural(state[owner][item], item)}` }); steps.push({ owner, verb, n, item, refused: true }); last = owner; lastItem = item; continue; }
      if (effect === 'add') state[owner][item] += n;
      else state[owner][item] -= n;
      if (effect === 'give' && other) { const to = other; state[to] ||= {}; state[to][item] = (state[to][item] ?? 0) + n; steps.push({ owner, verb, n, item, to }); last = owner; lastItem = item; continue; }
    }
    steps.push({ owner, verb, n, item });
    last = owner; lastItem = item;
  }
  return { state, steps, answers, refused, unread, starts, unknown, focus: { owner: last, item: lastItem } };
}
