// Type signatures and a finite pattern inventory (reviewer 02:15, owner 18:10): every word gets a signature
// with coarse-to-fine levels (knowledge types first, then morphology, closed-class words literal); adjacent
// content words are chunked into one token whose signature is its head's; sentences become patterns over the
// chunk signatures; mining counts how many patterns cover 80 % / 95 % of the sentences at each level.

import { typedLexicon } from './readtypes.mjs';

/**
 * The signature of a token as levels [fine, middle, coarse]. Options: `closed` (words that stay literal: the
 * function words of a language world; default the words the world's lexicon does not type and that are short),
 * `lemma`.
 */
export function signatureOf(world, token, { closed, lemma } = {}) {
  const t = String(token).toLowerCase();
  if (/^\d+([.,]\d+)?$/.test(t)) return ['<num>', '<num>', '<N>'];
  if (closed?.includes(t)) return [t, t, t]; // closed-class words stay literal, before any type a schema's words give them
  const lex = typedLexicon(world);
  const forms = [t, ...((lemma ?? world.lemma)?.(t) || []), t.replace(/s$/, ''), t.replace(/es$/, '')];
  const f = forms.find((x) => lex.has(x));
  const ss = f ? lex.get(f) : [];
  const verb = ss.find((x) => x.cat === 'attr' && x.verb); // a verb that means a key (make: sound) is a verb, not a noun
  if (verb && !ss.some((x) => x.cat === 'thing')) return [`<verb:${verb.key}>`, '<verb>', '<V>'];
  const s0 = ss.find((x) => x.cat === 'thing') ?? ss.find((x) => x.cat === 'attr' && !x.verb) ?? ss.find((x) => x.cat === 'kind') ?? ss.find((x) => x.cat === 'act');
  if (s0?.cat === 'thing') return [`<${s0.type}>`, '<thing>', '<N>'];
  if (s0?.cat === 'attr') return [`<attr:${s0.key}>`, '<attr>', '<N>'];
  if (s0?.cat === 'kind') return [`<kind:${s0.kind ?? s0.type}>`, '<kind>', '<N>'];
  if (s0?.cat === 'act') return [`<act:${s0.act}>`, '<act>', '<V>'];
  const word = ss.find((x) => x.cat === 'word' && !String(x.means).includes('.')); // a word the world declares for a key (make: sound), not a schema's word for its own types
  if (word) return [`<verb:${word.means}>`, '<verb>', '<V>'];
  if (closed ? closed.includes(t) : t.length <= 4) return [t, t, t]; // closed-class words stay literal
  const m = /(?:ing|ed|ly|er|est|s)$/.exec(t); // morphology: the word's ending as its class
  return [`<w-${m ? m[0] : '_'}>`, '<w>', '<w>'];
}

/** A sentence as chunks: adjacent content tokens (signatures that are types) merged, the head the last. */
export function chunk(world, text, options = {}) {
  const toks = String(text).toLowerCase().replace(/[?!.,;:]+/g, ' ').match(/[\p{L}\p{N}_'-]+/gu) || [];
  const out = [];
  for (const t of toks) { // bounded: the tokens
    const sig = signatureOf(world, t, options);
    const isContent = sig[0].startsWith('<') && sig[2] === '<N>';
    const last = out[out.length - 1];
    if (isContent && last?.content) { last.words.push(t); last.sig = sig; } else out.push({ words: [t], sig, content: isContent });
  }
  return out;
}

/**
 * Patterns mined from sentences at a signature level (0 fine, 1 middle, 2 coarse): { patterns: [{ pattern,
 * count, example }], sentences, at80, at95 }, the patterns most frequent first.
 */
export function minePatterns(world, sentences, { level = 1, ...options } = {}) {
  const counts = new Map();
  for (const s of sentences) {
    const p = chunk(world, s, options).map((c) => c.sig[level]).join(' ');
    const e = counts.get(p) || counts.set(p, { pattern: p, count: 0, example: s }).get(p);
    e.count++;
  }
  const patterns = [...counts.values()].sort((a, b) => b.count - a.count);
  const n = sentences.length;
  const at = (share) => { let acc = 0; for (let i = 0; i < patterns.length; i++) { acc += patterns[i].count; if (acc >= share * n) return i + 1; } return patterns.length; };
  return { patterns, sentences: n, at80: at(0.8), at95: at(0.95) };
}
