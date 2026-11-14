// The one seeded generator of the library (architecture review finding 2: twelve copies, some an LCG whose
// low bits collapse in floating point). mulberry32: 32-bit state, Math.imul, a float in [0, 1). The same
// seed gives the same sequence, in every module.

/** A seeded generator: () -> a float in [0, 1). */
export function seeded(seed = 1) {
  let x = Number(seed) >>> 0;
  return () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** An integer in [0, n) from a generator. */
export const below = (rnd, n) => Math.floor(rnd() * n);
