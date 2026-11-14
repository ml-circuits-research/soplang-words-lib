// Induction from cases (abstraction round item 4, Q54): cases that share a frame are anti-unified by
// the library's own `induce` into one reading rule (words that differ become variables; a variable
// that fills the frame is lifted to the kind of the thing it names, by a pattern on that thing's
// fact). A rule is proposed with its support, then judged on held-out cases and on the cousins of
// its cases; it is admitted only when the training cases all pass and the held-out share does not
// fall below `admit`. Nothing is told to the host's world: a rule is text to review.

import { induce } from './induce.mjs';

const enc = (text) => '@u utter ' + String(text).toLowerCase().replace(/[?!.]+\s*$/, '').match(/[\p{L}\p{N}_'-]+/gu).map((x, i) => `t${i + 1}=${x}`).join(' ');

/**
 * Proposals of reading rules from `cases` ([{ text, frame }] with frame { is: 'ask', key, of: { id } }).
 * Options: `heldOut` (more cases, not used to induce), `cousins(case) -> [cousins]` (valid ones are
 * held out too), `admit` (the least held-out share, default 1), `min` (cases per rule, default 2).
 * Returns [{ text, support, train: { pass, of }, heldOut: { pass, of }, admitted, why? }].
 */
export function learnRules(world, cases, { heldOut = [], cousins: cousinsOf, admit = 1, min = 2 } = {}) {
  const groups = new Map();
  for (const c of cases) { const n = enc(c.text).split(' ').length; const k = `${c.frame.is}|${c.frame.key}|${n}`; (groups.get(k) || groups.set(k, []).get(k)).push(c); }
  const out = [];
  let g = 0;
  for (const [key, group] of groups) {
    if (group.length < min) continue;
    const name = `learned_${++g}`;
    const examples = group.map((c) => {
      const thing = world.get(c.frame.of.id);
      return { when: `${enc(c.text)}\n@f ${thing.type} name=${c.frame.of.id}`, then: `@r ask key=${c.frame.key} of=${c.frame.of.id}` };
    });
    let r;
    try { r = induce(examples, { name }); } catch (e) { out.push({ group: key, why: String(e.message || e), admitted: false }); continue; }
    const answer = (text) => { // the rule alone, on a fork of the world: what it reads the text as
      const f = world.fork();
      if (!f.load(r.text).ok) return null;
      f.tell(enc(text));
      const rows = f.ask('ask key=?k of=?o');
      return rows.length === 1 ? { key: rows[0].k, of: rows[0].o } : null;
    };
    const judge = (list) => { let pass = 0; for (const c of list) { const a = answer(c.text); if (a && a.key === c.frame.key && a.of === (c.frame.of.id)) pass++; } return { pass, of: list.length }; };
    const held = [...heldOut.filter((c) => enc(c.text).split(" ").length === enc(group[0].text).split(" ").length), ...(cousinsOf ? group.flatMap((c) => cousinsOf(c).filter((x) => x.valid && x.text)) : [])];
    const train = judge(group), ho = judge(held);
    const share = ho.of ? ho.pass / ho.of : 1;
    out.push({ text: r.text, support: group.map((c) => c.text), train, heldOut: ho, admitted: train.pass === train.of && share >= admit, ...(train.pass < train.of ? { why: 'a training case fails' } : share < admit ? { why: `held-out ${ho.pass}/${ho.of}` } : {}) });
  }
  return out;
}
