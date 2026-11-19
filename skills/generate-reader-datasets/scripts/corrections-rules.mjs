// corrections-rules.mjs — the three classes the corpus audit found missing,
// all riding EXISTING label machinery (no new wire shapes for the reader heads):
//
//   1. CORRECTIONS ("no, the other one") — previous turn in context.previous,
//      target.fill:"context", constraints claimed {"from-previous": true};
//      the exclusion semantics is a runtime choice behavior (ranked candidates
//      minus the previous referent), not a reader-supervised field.
//   2. RULES and PREFERENCES ("from now on always…", "never draw X on Y again",
//      "I'd rather…") — constraints claimed {"rule": true, "pref": "<value surface>"}
//      ride character:'preference'; prohibitions ride polarity:'negative';
//      the reader learns WHICH texts are preference-shaped, the compiler turns
//      them into lr.pref-like facts (objective terms), prohibitions into lr.rule.
//   3. COMPLEX CONDITIONS ("if there are no boats, draw one") — compounds whose
//      first segment is a question seed (exists/count) and the second the act:
//      the cutter learns to split hypothesis+action in one message.
//
// Usage: node corrections-rules.mjs --seeds seeds-full.jsonl [--out variants/corrections-rules.jsonl]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const seedsPath = arg('seeds');
const OUT = arg('out', 'variants/corrections-rules.jsonl');
const seeds = readFileSync(seedsPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

const art = (k) => (/^[aeiou]/i.test(k) ? 'an' : 'a');
const out = [];

// ---- 1. corrections: need change-act seeds with existing targets + >=1 value constraint
const changeSeeds = seeds.filter((s) => s.act === 'change' && s.target.mode === 'existing' && s.seedId.startsWith('ux-') && s.constraints.some((c) => !c.key.endsWith('.kind')));
const CORRECTIONS = [
  (k) => `no, the other ${k}`,
  (k) => `not that ${k} — the other one`,
  (k) => `the other ${k}, sorry`,
  (k) => `no wait, the other ${k} instead`,
  (k) => `I meant the other ${k}`,
  (k) => `actually, the other ${k} please`,
  (k) => `the other ${k}, quick fix`,
  (k) => `sorry — wrong ${k}, use the other one`,
  (k) => `no no, the other ${k} entirely`,
  (k) => `wrong ${k} — the other one, please`,
  (k) => `not this ${k}, the one next to it`,
  (k) => `swap to the other ${k}`,
  (k) => `other ${k}, my mistake`,
  (k) => `let me correct that: the other ${k}`,
  (k) => `nope — the other ${k}`,
  (k) => `undo that pick, take the other ${k}`,
];
let ci = 0;
const correctionHosts = [];
for (const s of seeds) {
  if (correctionHosts.length >= 40) break;
  if (s.act === 'change' && s.target.mode === 'existing' && s.seedId.startsWith('ux-') && s.constraints.length >= 1) {
    const kindCon = s.constraints.find((c) => c.key.endsWith('.kind'));
    // hosts need a nameable kind so the previous turn reads naturally
    if (kindCon) correctionHosts.push(s);
  }
}
for (const s of correctionHosts) {
  const k = s.target.kindValue;
  const valC = s.constraints.find((c) => !c.key.endsWith('.kind') && !c.optional);
  const val = valC ? valC.surface : (s.constraints.find((c) => !c.key.endsWith('.kind'))?.surface ?? '');
  const prevText = `${s.act} the ${k}${val ? ' to ' + val : ''}`;
  const frame = CORRECTIONS[ci++ % CORRECTIONS.length];
  out.push({
    seedId: s.seedId, tier: 'human-correction', text: frame(k),
    previous: prevText,
    surfaces: {
      fill: 'context', // target kind ALSO resolves from the previous turn; no in-text claim
      ...Object.fromEntries(s.constraints.map((c) => [String(c.n), { 'from-previous': true }])),
    },
  });
}

// ---- 2. rules & preferences: preference statements with character:'preference'
const RULE_FRAMES = [
  (k, v) => ({ text: `from now on, always make ${art(k)} ${k} ${v}`, kind: k, value: v, neg: false }),
  (k, v) => ({ text: `I'd rather every ${k} ends up ${v}`, kind: k, value: v, neg: false }),
  (k, v) => ({ text: `remember: ${k}s go ${v} around here`, kind: k, value: v, neg: false }),
  (k, v) => ({ text: `as a rule, ${k}s should be ${v}`, kind: k, value: v, neg: false }),
  (k, v) => ({ text: `never make the ${k} ${v} again`, kind: k, value: v, neg: true }),
  (k, v) => ({ text: `no more ${v} ${k}s, please`, kind: k, value: v, neg: true }),
  (k, v) => ({ text: `stop setting ${k}s to ${v}`, kind: k, value: v, neg: true }),
  (k, v) => ({ text: `${k}s at ${v} — just don't`, kind: k, value: v, neg: true }),
  (k, v) => ({ text: `make it a habit: ${k}s come out ${v}`, kind: k, value: v, neg: false }),
  (k, v) => ({ text: `whenever I ask for ${art(k)} ${k}, I want it ${v}`, kind: k, value: v, neg: false }),
];
const ruleHosts = [];
for (const s of seeds) {
  if (ruleHosts.length >= 50) break;
  if (s.act === 'change' && s.seedId.startsWith('ux-')) {
    const kindCon = s.constraints.find((c) => c.key.endsWith('.kind') && !c.optional);
    // honest standalone-rule hosts: the FIRST declared wire is the kind, every other
    // constraint is optional (a short rule text says the kind and the one preference
    // value — nothing else mandatory can hide in it)
    if (!kindCon || s.constraints[0] !== kindCon) continue;
    const nonKind = s.constraints.filter((c) => c !== kindCon);
    if (!nonKind.length || !nonKind.every((c) => c.optional)) continue;
    ruleHosts.push(s);
  }
}
let ri = 0;
const seenRuleText = new Set();
for (const s of ruleHosts) {
  const k = s.target.kindValue;
  const valC = s.constraints.find((c) => !c.key.endsWith('.kind') && c.optional);
  if (!valC) continue;
  const f = RULE_FRAMES[ri % RULE_FRAMES.length];
  const r = f(k, valC.surface);
  if (seenRuleText.has(r.text)) { ri += 1; continue; }
  seenRuleText.add(r.text);
  ri += 1;
  const kindN = String(s.constraints.findIndex((c) => c.key.endsWith('.kind')));
  const valN = String(valC.n);
  out.push({
    seedId: s.seedId, tier: r.neg ? 'human-prohibition' : 'human-preference', text: r.text,
    surfaces: {
      kind: k, [kindN]: k,
      [valN]: r.neg ? { neg: r.value } : { rule: true, pref: r.value },
    },
  });
  // extra rules when the host has a second optional value (different preference object)
  const val2 = s.constraints.filter((c) => !c.key.endsWith('.kind') && c.optional)[1];
  if (val2) {
    const f3 = RULE_FRAMES[(ri + 7) % RULE_FRAMES.length];
    const r3 = f3(k, val2.surface);
    if (!seenRuleText.has(r3.text)) {
      seenRuleText.add(r3.text);
      out.push({
        seedId: s.seedId, tier: r3.neg ? 'human-prohibition' : 'human-preference', text: r3.text,
        surfaces: { kind: k, [kindN]: k, [String(val2.n)]: r3.neg ? { neg: r3.value } : { rule: true, pref: r3.value } },
      });
    }
  }
  // a second phrasing per host for spread
  const f2 = RULE_FRAMES[(ri + 5) % RULE_FRAMES.length];
  const r2 = f2(k, valC.surface);
  if (r2.text !== r.text) out.push({
    seedId: s.seedId, tier: r2.neg ? 'human-prohibition' : 'human-preference', text: r2.text,
    surfaces: { kind: k, [kindN]: k, [valN]: r2.neg ? { neg: r2.value } : { rule: true, pref: r2.value } },
  });
}

// ---- 3. conditionals: question-seed + change-seed compounds THE CUTTER must split
const qSeeds = [...new Map(seeds.filter((s) => s.seedId.startsWith('q-') && s.constraints[0]?.value === 'exists').map((s) => [s.target.kindValue, s])).values()];
const doHosts = seeds.filter((s) => s.act === 'make' && s.target.mode === 'new' && s.seedId.startsWith('ux-')
  && s.constraints.every((c) => c.key.endsWith('.kind') || c.optional));
const COND = [
  (k) => ({ q: `if there are no ${k}`, claim: 'there are no', tail: '— then go ahead and make a new one' }),
  (k) => ({ q: `if we are missing a ${k}`, claim: 'we are missing', tail: '— draw one right away' }),
  (k) => ({ q: `if we actually have no ${k}`, claim: 'we actually have no', tail: '— create one for me in that case' }),
  (k) => ({ q: `if I see no ${k} on the board`, claim: 'I see no', tail: '— put one in please' }),
  (k) => ({ q: `if nothing of the ${k} kind showed up`, claim: 'nothing of the', tail: '— go on, make one' }),
  (k) => ({ q: `if the board has no ${k}`, claim: 'the board has no', tail: '— add it now please' }),
];
let qi = 0, di = 0;
for (let i = 0; i < Math.min(24, qSeeds.length, doHosts.length); i++) {
  const q = qSeeds[qi++ % qSeeds.length];
  const d = doHosts[di++ % doHosts.length];
  const k = q.target.kindValue;
  const cnd = COND[i % COND.length](k);
  const qText = cnd.q;
  const dKindText = `${art(d.target.kindValue)} ${d.target.kindValue}`.replace(/^(a|an) /, '');
  const dKind = d.target.kindValue;
  const dText = cnd.tail.replace(/a new one|one/, (m) => m === 'a new one' ? `a new ${dKind}` : `${art(dKind)} ${dKind}`);
  const text = [qText, dText].join(' ');
  const dTextOut = dText;
  const dKindX = d.target.kindValue;
  const kindN = String(d.constraints.findIndex((c) => c.key.endsWith('.kind')));
  out.push({
    seedIds: [q.seedId, d.seedId], tier: 'human-conditional',
    text,
    segments: [qText, dTextOut],
    surfacesPer: [
      { kind: k, '0': cnd.claim },
      { kind: dKindX, ...(kindN >= 0 ? { [kindN]: dKindX } : {}), ...Object.fromEntries(d.constraints.filter((c) => !c.key.endsWith('.kind')).map((c) => [String(c.n), c.optional ? null : c.surface])) },
    ],
  });
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out.map((v) => JSON.stringify(v)).join('\n') + '\n');
const count = (t) => out.filter((v) => v.tier === t).length;
console.log(`corrections-rules: ${out.length} variants — corrections ${count('human-correction')}, preferences ${count('human-preference')}, prohibitions ${count('human-prohibition')}, conditionals ${count('human-conditional')} -> ${OUT}`);
