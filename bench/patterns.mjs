// R19 item 7: a host matcher that tries every pattern on a sentence, against one that asks
// PatternIndex for the patterns the sentence can match. Synthetic: 3,000 patterns over a
// vocabulary of 2,000 words (Zipf-like: a few words common), each needing 1 to 3 sets of
// 1 to 3 words; 1,000 sentences of 8 words. The cost of matching one pattern is the host's
// and is the same either way; what changes is how many patterns it tries.
// `node bench/patterns.mjs` (add `bundle` for docs/sopworld.mjs).
const { PatternIndex } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const word = () => `w${Math.floor(2000 * rnd() ** 2.5)}`; // low numbers are common
const patterns = Array.from({ length: 3000 }, (_, i) => ({ id: `p${i}`, needs: Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => Array.from({ length: 1 + Math.floor(rnd() * 3) }, word)) }));
const sentences = Array.from({ length: 1000 }, () => Array.from({ length: 8 }, word));
const time = (fn) => { const t = process.hrtime.bigint(); const r = fn(); return [Number(process.hrtime.bigint() - t) / 1e6, r]; };
const fits = (p, ws) => p.needs.every((s) => s.some((w) => ws.has(w)));
const [tAll, nAll] = time(() => { let n = 0; for (const s of sentences) { const ws = new Set(s); for (const p of patterns) if (fits(p, ws)) n++; } return n; });
const [tBuild, ix] = time(() => { const x = new PatternIndex(patterns); x.stats(); return x; });
const [tIx, nIx] = time(() => { let n = 0; for (const s of sentences) n += ix.candidates(s).length; return n; });
console.log(`every pattern on every sentence: ${patterns.length} tried per sentence; filtering them alone ${tAll.toFixed(1)} ms for 1,000 sentences`);
console.log(`PatternIndex: built in ${tBuild.toFixed(1)} ms; ${(nIx / sentences.length).toFixed(2)} handed out per sentence (same set: ${nIx === nAll}); ${tIx.toFixed(1)} ms for 1,000 sentences`);
