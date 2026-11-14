// resolve: the things a noun phrase names. The language part (which
// word is a determiner, an ordinal, a pronoun) comes from the grammar world through
// parseText / nounPhrase; the resolution over the world's things is here, and it is
// language-free: kinds and values are named by the matrix and by core.word.
//
// Returns { ids, tier, how } or { ids: [], why, which? }. The tier says how sure the
// reading is, with std.fill's names: `user` (the words pick the things), `scene` (one of
// that kind exists), `focus` (the dialogue's focus picked it), `slip` (a word one letter
// away from a kind); `how` lists each step taken, so a reply can say what was assumed.
import { parseText, nounPhrase } from './grammar.mjs';

const ref = (id) => '$' + String(id).replace(/^\$/, '');
const THING = 'std.schema.thing';

/** The kind or value a word means: core.word text= means= (of= narrows to a key), else itself. */
function meaning(w, word, of) {
  if (word === undefined) return [];
  const t = String(word).toLowerCase();
  const out = new Set([t]);
  for (const x of w.ofType('core.word')) { // bounded: the words of the world
    if (!(x.attrs.text || []).some((s) => String(s).toLowerCase() === t)) continue;
    const o = x.attrs.of?.[0];
    if (of === undefined || o === undefined || o === of || String(o).endsWith(`.${of}`)) for (const m of x.attrs.means || []) out.add(String(m).toLowerCase());
  }
  return [...out];
}

/** One slip: one letter added, dropped, changed, or two neighbours swapped (bounded: two short words). */
function oneSlip(a, b) {
  if (a.length === b.length && a.length >= 4) { const d = [...a].map((c, k) => k).filter((k) => a[k] !== b[k]); if (d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]]) return true; }
  if (a === b || Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 4) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) { // bounded: the letters
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** The focus, newest first: the option, else std.focus.last wires that name things. */
function focusOf(w, focus) {
  if (focus) return [].concat(focus).map((x) => String(x).replace(/^\$/, ''));
  return w.ofType('std.focus.last').flatMap((x) => (x.attrs.value || []).map((v) => String(v).replace(/^\$/, ''))).filter((id) => w.get(id)?.type === THING);
}

/**
 * The things a phrase names. `phrase` is text (read with `grammar`, parseText's options,
 * start NP) or a nounPhrase result. Options: `grammar`, `cats` (nounPhrase's categories),
 * `focus` (ids, newest first), `inside` (a thing id: only things in it).
 */
export function resolve(world, phrase, { grammar = {}, cats, focus, inside, focusFor = 'any' } = {}) { // bounded: the depth of the phrase (coordination, PP)
  let np = phrase;
  if (typeof phrase === 'string') {
    const p = parseText(world, phrase, { start: 'NP', ...grammar });
    if (!p.length) return { ids: [], why: `cannot read "${phrase}" as a noun phrase`, failure: p.unknown ? 'unknown-word' : 'unread', ...(p.unknown ? { unknown: p.unknown } : {}) };
    np = nounPhrase(p[0].tree, cats);
  }
  if (np.coord) { // coordination: the union (or, for a word the grammar marks kind=choice, a question)
    // a part without its noun takes one: a bare number the noun of the part before ("tables 1 and 2"), else the noun of the next part that has one ("the red or the blue house")
    const items = np.coord.map((c, k) => {
      if (c.head !== undefined || c.pron !== undefined || c.coord) return c;
      const donor = (c.num !== undefined && !c.mods?.length ? np.coord.slice(0, k).reverse() : []).find((x) => x.head !== undefined) ?? np.coord.slice(k + 1).find((x) => x.head !== undefined) ?? np.coord.slice(0, k).reverse().find((x) => x.head !== undefined);
      return donor ? { ...c, head: donor.head, lemma: donor.lemma, ...(c.num !== undefined && c.numAfter === undefined ? { numAfter: true } : {}) } : c;
    });
    const parts = items.map((c) => resolve(world, c, { cats, focus, inside, focusFor }));
    const bad = parts.find((r) => r.why);
    if (bad) return bad;
    const order = ['user', 'scene', 'focus', 'slip'];
    const ids = [...new Set(parts.flatMap((r) => r.ids))];
    const choice = np.conj !== undefined && world.ofType(grammar.types?.coord ?? 'g.coord').some((x) => (x.attrs.word || []).includes(np.conj) && x.attrs.kind?.[0] === 'choice');
    if (choice) return { ids: [], why: `which: ${ids.join(' or ')}?`, ask: true, which: ids, how: parts.flatMap((r) => r.how) }; // a choice is asked, never both, never the last
    return { ids, tier: parts.map((r) => r.tier).sort((a, b) => order.indexOf(b) - order.indexOf(a))[0], how: parts.flatMap((r) => r.how) };
  }
  const how = [];
  const things = world.ofType(THING).filter((t) => !inside || Object.values(t.attrs).some((vs) => vs.includes(ref(inside))));
  const fc = focusOf(world, focus);

  // a part of a set ("two of the tables", "some of them"): the set inside; the whole set when the count covers it, else asked
  if (np.head === undefined && np.pron === undefined && np.pp?.length === 1 && np.pp[0].np && (np.num !== undefined || np.quant !== undefined || np.det !== undefined)) {
    const inner = resolve(world, { ...np.pp[0].np, quant: np.pp[0].np.quant ?? 'all' }, { grammar, cats, focus, inside }); // the set the part is taken from
    if (inner.why) return inner;
    const n = np.num !== undefined ? Number(np.num) : undefined;
    if (n === undefined || n >= inner.ids.length) return { ...inner, how: [...inner.how, `part of ${inner.ids.length}: all of them`] };
    return { ids: [], why: `which ${n} of ${inner.ids.length}?`, ask: true, which: inner.ids };
  }
  // a pronoun: the newest thing in focus
  if (np.pron !== undefined && np.head === undefined) {
    const id = fc.find((x) => things.some((t) => t.id === x));
    return id ? { ids: [id], tier: 'focus', how: [`${np.pron} = ${id} (the focus)`], guess: { word: np.pron, ids: [id] } } : { ids: [], why: `nothing in focus for "${np.pron}"`, failure: 'no-focus' };
  }
  // the kind: everything, a kind by name or by a word that means it, else a kind one letter away
  let pool = things, kind = null, tier = 'user';
  if (np.head !== undefined || np.lemma !== undefined) {
    const kinds = new Set(things.map((t) => t.attrs.kind?.[0]));
    const means = [...meaning(world, np.lemma), ...meaning(world, np.head)];
    kind = means.find((k) => kinds.has(k));
    if (!kind) {
      kind = [...kinds].find((k) => oneSlip(String(np.lemma ?? np.head), k));
      if (kind) { tier = 'slip'; how.push(`"${np.lemma ?? np.head}" read as ${kind} (one letter away)`); }
    } else if (kind !== String(np.lemma ?? np.head).toLowerCase()) how.push(`"${np.head}" means ${kind}`);
    if (!kind) return { ids: [], why: `there is no ${np.lemma ?? np.head}`, kind: np.lemma ?? np.head, failure: 'unknown-kind' };
    pool = things.filter((t) => t.attrs.kind?.[0] === kind);
  }
  // modifiers and a name: a value of any key (or a word that means one)
  const has = (t, word, key) => Object.entries(t.attrs).some(([k, vs]) => k !== 'kind' && k !== 'world' && (key === undefined || k === key) && vs.some((v) => meaning(world, word, k).includes(String(v).toLowerCase())));
  for (const m of np.mods || []) {
    if (meaning(world, m).includes('std.other')) { // "the other one": the things of the kind not in focus
      const next = pool.filter((t) => !fc.includes(t.id));
      if (next.length === pool.length) return { ids: [], why: `other than what? nothing of the kind is in focus`, kind };
      pool = next; how.push(`${m}: not ${fc.filter((x) => things.some((t) => t.id === x)).join(', ')}`); continue;
    }
    const next = pool.filter((t) => has(t, m));
    if (!next.length) return { ids: [], why: `there is no ${m} ${kind ?? 'thing'}`, kind, failure: 'none' };
    pool = next; how.push(`${m}: ${pool.length} left`);
  }
  if (np.name !== undefined) {
    pool = pool.filter((t) => has(t, np.name, 'name'));
    if (!pool.length) return { ids: [], why: `there is no ${kind ?? 'thing'} called ${np.name}`, kind, failure: 'none' };
  }
  // a negation lead ("not the red one"): the things of the kind the modifiers do not pick
  if (np.negated) {
    const all = kind ? things.filter((t) => t.attrs.kind?.[0] === kind) : things;
    const rest = all.filter((t) => !pool.includes(t));
    if (!rest.length) return { ids: [], why: `there is no other ${kind ?? 'thing'}`, kind, failure: 'none' };
    pool = rest; how.push(`not: ${pool.length} left`);
  }
  // a relation: a thing with a key that refers to the thing the phrase inside names
  for (const pp of np.pp || []) {
    const inner = pp.np ?? (pp.words?.length > 1 ? { head: pp.words[pp.words.length - 1], lemma: pp.words[pp.words.length - 1], mods: [] } : null);
    if (!inner) continue;
    const r = resolve(world, inner, { cats, focus, focusFor });
    if (r.why || r.ids.length !== 1) return { ids: [], why: r.why ?? `which ${inner.head}? there are ${r.ids.length}`, ...(r.ids?.length ? { which: r.ids } : {}) };
    pool = pool.filter((t) => Object.values(t.attrs).some((vs) => vs.includes(ref(r.ids[0]))));
    how.push(`${pp.words.join(' ')}: ${pool.length} left`);
    if (!pool.length) return { ids: [], why: `there is no ${kind ?? 'thing'} ${pp.words.join(' ')}`, kind };
  }
  // a set: all / each / every / both, or a phrase with no kind (everything)
  if (np.quant !== undefined || (np.head === undefined && np.name === undefined)) { // a bare name is one thing, not a set
    if (np.quant === 'both' && pool.length !== 2) return { ids: [], why: `there are ${pool.length} ${kind}s, not two`, which: pool.map((t) => t.id) };
    return { ids: pool.map((t) => t.id), tier, how: [...how, `${np.quant ?? 'every'}: ${pool.length}`] };
  }
  // an ordinal ("the third", "the last") or a number after the noun ("table 2")
  if (np.ord !== undefined || (np.num !== undefined && np.numAfter)) {
    const n = Number(np.ord ?? np.num);
    const byId = pool.find((t) => t.id === `${kind}${n}`);
    const t = np.ord === undefined && byId ? byId : n < 0 ? pool[pool.length + n] : pool[n - 1];
    return t ? { ids: [t.id], tier, how: [...how, `${np.ord !== undefined ? 'the ' + (n < 0 ? 'last' : n) : 'number ' + n}: ${t.id}`] } : { ids: [], why: `there is no ${n < 0 ? 'last' : n + '.'} ${kind}`, kind, failure: 'no-number' };
  }
  // a count before the noun ("3 tables"): exactly that many
  if (np.num !== undefined) {
    const n = Number(np.num);
    if (pool.length === n) return { ids: pool.map((t) => t.id), tier, how: [...how, `${n}: all of them`] };
    return { ids: [], why: `there are ${pool.length} ${kind}s, not ${n}`, which: pool.map((t) => t.id) };
  }
  // one thing: the words picked one, the scene has one, or the focus picks among several
  if (pool.length === 1) return { ids: [pool[0].id], tier: tier === 'slip' ? 'slip' : how.length || np.mods?.length || np.name ? tier : 'scene', how };
  const f = focusFor === 'pronoun' ? undefined : fc.find((x) => pool.some((t) => t.id === x)); // focusFor: 'pronoun' keeps the focus for pronouns only
  if (f) return { ids: [f], tier: 'focus', how: [...how, `${f}: the one in focus`] };
  return { ids: [], why: `which ${kind}? there are ${pool.length}`, kind, which: pool.map((t) => t.id), failure: 'ambiguous', ask: true };
}
