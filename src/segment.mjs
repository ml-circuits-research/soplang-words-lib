// One segmenter that knows the act forms (Round 28, item 2): a message cut into clauses, one
// act each, with the cut points read from facts and the act words from the world. Hosts then
// need no clause encoder of their own. Language-free: what joins two clauses, the frame
// leads and the words of the acts are facts of a language world and of the world schemas.
//
// A joiner (`types.joiner`, wires with `text`, `cut`, `card_cut`) cuts when an act word
// starts what follows it ("add a box and connect it to the shelf"). Without that it is a
// list or a coordination ("make a cup, a plate and a bowl", "ann, bob and cy"). A run of
// joiners is one ("and then"). A comma right after a frame lead (`types.frameLead`: "from now on,")
// never cuts. The act words are the names of the world's actions and the `core.word`
// texts that mean one, plus `options.acts`.

const unq = (t) => String(t).replace(/^"|"$/g, '').replace(/_/g, ' ').toLowerCase();

/** The words that start an act: action names, core.word texts that mean an action, and the host's. */
export function actWords(world, extra = []) {
  const actions = new Set([...world._compiled().actions.keys()].map(unq)); // the actions the matrix declares (from its modules too)
  const out = new Set([...actions, ...extra.map(unq)]);
  for (const w of world.ofType('core.word')) if ((w.attrs.means || []).some((m) => actions.has(unq(m)))) for (const t of w.attrs.text || []) out.add(unq(t));
  return out;
}

/**
 * Cut `text` into clauses: [{ text, from, to, joiner? }] (token positions; `joiner` is the
 * joiner text that cut before it). Options: `types: { joiner, frameLead }` (the fact types;
 * defaults `g.joiner`, `g.frame_lead`), `acts` (more act words).
 */
export function segment(world, text, { types = {}, acts = [] } = {}) {
  const T = { joiner: 'g.joiner', frameLead: 'g.frame_lead', ...types };
  const joiners = new Map();
  for (const j of world.ofType(T.joiner)) for (const t of j.attrs.text || []) joiners.set(unq(t), { cut: j.attrs.cut?.[0] === 'yes', card: j.attrs.card_cut?.[0] !== 'no' });
  const leads = world.ofType(T.frameLead).flatMap((f) => (f.attrs.text || []).map((t) => unq(t).split(/\s+/)));
  const verbs = actWords(world, acts);
  const tok = String(text).toLowerCase().match(/[\p{L}\p{N}]+(?:'[\p{L}]+)?|[,;]/gu) || [];
  const isAct = (i) => i < tok.length && verbs.has(tok[i]);
  const leadEndsAt = (i) => leads.some((l) => l.length <= i && l.every((w, k) => tok[i - l.length + k] === w)); // a frame lead ends right before token i
  const clauses = [];
  let start = 0, joiner;
  for (let i = 0; i < tok.length; i++) { // bounded: the tokens
    const j = joiners.get(tok[i]);
    if (!j) continue;
    let k = i; // a run of joiners is one ("and then", ", and")
    while (k + 1 < tok.length && joiners.has(tok[k + 1])) k++; // bounded: the tokens
    if (tok[i] === ',' && leadEndsAt(i)) { i = k; continue; } // "from now on, ..." keeps its comma
    const run = tok.slice(i, k + 1).map((x) => joiners.get(x));
    const before = tok.slice(start, i);
    const cut = isAct(k + 1) && run.some((x) => x.card || x.cut); // an act word follows: a new clause
    if (cut && before.length) { clauses.push({ text: before.join(' ').replace(/ ,/g, ','), from: start, to: i, ...(joiner ? { joiner } : {}) }); start = k + 1; joiner = tok.slice(i, k + 1).join(' '); }
    i = k;
  }
  const rest = tok.slice(start);
  if (rest.length) clauses.push({ text: rest.join(' ').replace(/ ,/g, ','), from: start, to: tok.length, ...(joiner ? { joiner } : {}) });
  return clauses;
}
