// Optional provenance for grammar tokens. This deliberately does not align
// arbitrary rewritten text by matching repeated words or guessing an edit path.
export const GRAMMAR_WORDS = /'s\b|[\p{L}\p{N}]+(?:'(?!s\b)[\p{L}]+)?|[&]/gu;

export function grammarSource(original, tokens, parses, { rewritten = false, budget = 20000 } = {}) {
  const unavailable = reason => ({ text: original, unit: 'unicode-scalar', status: 'unavailable', tokenRanges: null, reason });
  if (rewritten) return unavailable('unaligned-alternation');
  if (!Number.isSafeInteger(budget) || budget < 0) return unavailable('invalid-budget');
  let steps = 0;
  const exhausted = {}, tick = () => { if (++steps > budget) throw exhausted; };
  try {
    // Bound the input before allocating its lowercased correspondence. A scalar
    // can emit more than one code point; UTF-16 offsets alone are not source offsets.
    const pieces = [];
    let scalar = 0;
    for (const character of original) {
      tick();
      const point = character.codePointAt(0);
      if (point >= 0xd800 && point <= 0xdfff) return unavailable('invalid-unicode');
      pieces.push({ lower: character.toLowerCase(), scalar: scalar++ });
    }
    const lower = original.toLowerCase(), offsets = [];
    let offset = 0;
    for (const piece of pieces) {
      tick();
      const actual = lower.slice(offset, offset + piece.lower.length);
      // Context-sensitive casing can change a character (for example final
      // sigma) without changing its contribution. Verify the case-equivalent
      // segment rather than replacing whole-string casing with scalar casing.
      if (actual.toUpperCase() !== piece.lower.toUpperCase()) return unavailable('unsupported-case-mapping');
      for (let j = 0; j < piece.lower.length; j++) { tick(); offsets.push(piece.scalar); }
      offset += piece.lower.length;
    }
    if (offset !== lower.length) return unavailable('unsupported-case-mapping');
    const raw = [];
    for (const match of lower.matchAll(GRAMMAR_WORDS)) {
      tick();
      raw.push({ text: match[0], range: [offsets[match.index], offsets[match.index + match[0].length - 1] + 1] });
    }
    const append = (ranges, range) => {
      tick();
      const previous = ranges[ranges.length - 1];
      if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
      else ranges.push([...range]);
    };
    const tokenRanges = [];
    let at = 0;
    for (const token of tokens) {
      tick(); const ranges = [];
      // A multiword lexeme is one parser token, but each original word remains
      // separate evidence when whitespace or punctuation lies between them.
      for (const part of token.split(/\s+/)) {
        tick();
        if (raw[at]?.text !== part) return unavailable('token-alignment');
        append(ranges, raw[at++].range);
      }
      tokenRanges.push(ranges);
    }
    if (at !== raw.length) return unavailable('token-alignment');
    const pending = parses.map(p => p.tree), seen = new Set(), additions = [];
    for (let i = 0; i < pending.length; i++) {
      tick(); const node = pending[i];
      if (seen.has(node)) continue;
      seen.add(node);
      const ranges = [];
      for (let j = node.span[0]; j < node.span[1]; j++) {
        tick();
        for (const range of tokenRanges[j]) append(ranges, range);
      }
      additions.push([node, ranges]);
      for (const child of [...(node.children || []), ...(node.coord || [])]) { tick(); pending.push(child); }
    }
    // All-or-nothing decoration: budget exhaustion never leaves some nodes with
    // apparently valid provenance while the rest silently lack it.
    for (let i = 0; i < additions.length; i++) tick(); // reserve decoration work before any mutation
    for (const [node, ranges] of additions) node.sourceRanges = ranges;
    return { text: original, unit: 'unicode-scalar', status: 'exact', tokenRanges };
  } catch (error) {
    if (error === exhausted) return unavailable('budget');
    throw error;
  }
}
