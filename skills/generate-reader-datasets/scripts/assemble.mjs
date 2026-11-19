// assemble.mjs — validate authored variants against their seeds and emit training
// examples on the ui-human schema. Validation is mechanical and jealous:
//   - every claimed constraint surface must appear in the text (first occurrence
//     becomes the span); more than one occurrence => quarantine (reported, not labeled);
//   - dropped optionals and vague optionals become completion.requirements, never gold;
//   - typos ({"typo": "..."}) and out-of-vocabulary synonyms ({"syn": "..."}) keep the
//     CANONICAL seed label and record typo_of/alias_of — the reader must learn that
//     "howse"/"cottage" resolve to the declared value;
//   - variant lines are single-request OR compound: {"seedIds":[a,b], "segments":[...],
//     "surfacesPer":[{...},{...}], "tier":"human-compound"} — segments must concatenate
//     to the text exactly; each segment is validated as its own request with span
//     offsets (both for the cutter: one message, several intents);
//   - duplicate texts (in-set and against --reject-from corpora) are rejected.
//
// Usage:
//   node assemble.mjs --seeds seeds.jsonl --variants variants/   (a .jsonl file or a directory)
//                     [--reject-from old1.jsonl old2.jsonl]
//                     [--out examples.jsonl] [--report report.json]
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const seedsPath = arg('seeds');
const OUT = arg('out', 'examples.jsonl');
const REPORT = arg('report', 'report.json');
if (!seedsPath) { console.error('usage: assemble.mjs --seeds <jsonl> --variants <file|dir> [--reject-from ...]'); process.exit(1); }

const seeds = new Map();
for (const line of readFileSync(seedsPath, 'utf8').trim().split('\n')) {
  if (!line) continue;
  const s = JSON.parse(line);
  seeds.set(s.seedId, s);
}

const seenTexts = new Set();
{
  const i = process.argv.indexOf('--reject-from');
  if (i > 0) {
    for (const p of process.argv.slice(i + 1)) {
      if (p.startsWith('--')) break;
      if (!existsSync(p)) continue;
      for (const line of readFileSync(p, 'utf8').trim().split('\n')) {
        if (!line) continue;
        try { seenTexts.add(JSON.parse(line).text.trim().toLowerCase()); } catch {}
      }
    }
  }
}

const files = [];
{
  const v = arg('variants');
  if (!v || !existsSync(v)) { console.error('no variant files under --variants (expected a .jsonl file or a directory of them)'); process.exit(1); }
  if (v.endsWith('.jsonl')) files.push(v);
  else for (const f of readdirSync(v).sort()) if (f.endsWith('.jsonl')) files.push(`${v}/${f}`);
  if (!files.length) { console.error('no variant files under --variants'); process.exit(1); }
}

// one request inside one segment (offset shifts every span into the whole text)
const buildRequest = ({ seed, segment, offset, surfaces, note }) => {
  const spanAt = (needle) => {
    const idx = segment.indexOf(needle);
    if (idx < 0) return { absent: true };
    return { start: idx, end: idx + needle.length, ambiguous: segment.indexOf(needle, idx + 1) >= 0 };
  };
  const constraints = [], requirements = [], deferred = [];
  let bad = null, ambiguous = false;
  for (const c of seed.constraints) {
    const claimed = surfaces[String(c.n)];
    const isMandatory = !c.optional;
    if (claimed === null) {
      if (isMandatory) { bad = `dropped-mandatory:${c.key}`; break; }
      requirements.push({ key: c.key, requirement: 'omitted', seedValue: c.value });
      continue;
    }
    if (claimed && typeof claimed === 'object' && claimed['from-previous'] === true) {
      deferred.push({ key: c.key, requirement: 'from-previous', seedValue: c.value });
      continue; // runtime carry-over from the previous turn; the reader never sees the word here
    }
    const vague = claimed && typeof claimed === 'object' && typeof claimed.vague === 'string' ? claimed.vague : null;
    if (vague && isMandatory) { bad = `vague-mandatory:${c.key}`; break; }
    const typo = claimed && typeof claimed === 'object' && typeof claimed.typo === 'string' ? claimed.typo : null;
    const syn = claimed && typeof claimed === 'object' && typeof claimed.syn === 'string' ? claimed.syn : null;
    // negation rides the EXISTING polarity field: the negated value keeps its own span
    const neg = claimed && typeof claimed === 'object' && typeof claimed.neg === 'string' ? claimed.neg : null;
    // rules/preferences ride the EXISTING character field ('preference'), not a new wire shape
    const pref = claimed && typeof claimed === 'object' && (claimed.rule === true || typeof claimed.pref === 'string');
    const surface = vague ?? typo ?? syn ?? neg ?? (typeof claimed === 'object' && typeof claimed.pref === 'string' ? claimed.pref : undefined) ?? (claimed === undefined || typeof claimed === 'object' ? c.surface : String(claimed));
    let sp = spanAt(neg ?? (typeof claimed === 'object' && typeof claimed.pref === 'string' ? claimed.pref : surface));
    if (pref === true && typeof surface === 'string' && !neg) sp = spanAt(claimed.pref ?? surface);
    if (sp.absent) {
      if (vague) { bad = `vague-surface-missing:${c.key}`; break; }
      if (isMandatory) { bad = `surface-missing:${c.key}:${String(surface).slice(0, 40)}`; break; }
      requirements.push({ key: c.key, requirement: 'omitted', seedValue: c.value });
      continue;
    }
    if (sp.ambiguous) { ambiguous = true; break; }
    constraints.push({
      key: c.key, value: vague ? null : c.value,
      value_span: [offset + sp.start, offset + sp.end], surface,
      operator: c.operator, phase: c.phase,
      polarity: neg ? 'negative' : c.polarity,
      character: (vague || pref) ? 'preference' : 'requirement',
      ...(vague ? { qualitative: true } : {}),
      ...(typo ? { typo_of: c.surface } : {}),
      ...(syn ? { alias_of: c.surface, alias_unverified: true } : {}),
    });
    if (vague) requirements.push({ key: c.key, requirement: 'vague', value: vague, seedValue: c.value });
  }
  if (bad || ambiguous) return { bad, ambiguous };
  // the kind surface (claimable as plain text, typo or out-of-vocabulary synonym);
  // fill:"context" targets (corrections, "the other one", pronoun-led follow-ups)
  // skip the in-text kind requirement — the referent resolves at runtime.
  const kindClaim = surfaces.kind;
  const fill = surfaces.fill;
  const kindSurface = typeof kindClaim === 'string' ? kindClaim
    : kindClaim && typeof kindClaim.typo === 'string' ? kindClaim.typo
    : kindClaim && typeof kindClaim.syn === 'string' ? kindClaim.syn
    : String(seed.target.kindValue);
  const ksp = spanAt(kindSurface);
  if (fill !== 'context' && ksp.absent) return { bad: `kind-missing:${kindSurface}`, ambiguous: false };
  if (fill !== 'context' && ksp.ambiguous) return { bad: null, ambiguous: true };
  return {
    request: {
      span: [offset, offset + segment.length],
      trigger: (seed.canonicalText || '').split(' ')[0],
      act: seed.act, mood: 'do',
      target: {
        type: String(seed.on || 'drawn').split('.').pop(),
        mode: seed.target.mode,
        determiner: seed.target.mode === 'new' ? 'indefinite' : 'definite',
        kind: seed.target.kindValue,
        ...(fill ? { fill } : {}),
        ...(fill === 'context' ? {} : { kind_span: [offset + ksp.start, offset + ksp.end] }),
        ...(kindClaim && typeof kindClaim.typo === 'string' ? { typo_of: String(seed.target.kindValue) } : {}),
        ...(kindClaim && typeof kindClaim.syn === 'string' ? { alias_of: String(seed.target.kindValue), alias_unverified: true } : {}),
      },
      constraints,
    },
    requirements,
    deferred,
  };
};

const examples = [], quarantined = [], rejected = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').trim().split('\n');
  const base = f.split('/').pop().replace('.jsonl', '');
  for (const line of lines) {
    let v; try { v = JSON.parse(line); } catch { rejected.push({ file: f, reason: 'bad-json' }); continue; }
    const text = String(v.text || '').trim();
    if (!text) { rejected.push({ seedId: v.seedId, reason: 'empty-text' }); continue; }
    const low = text.toLowerCase();
    if (seenTexts.has(low)) { rejected.push({ seedId: v.seedId, reason: 'duplicate' }); continue; }

    const tier = v.tier || 'human-equivalent';
    let built = { requests: [], requirements: [], seedIds: [], cohort: null };

    if (Array.isArray(v.seedIds)) { // compound: several intents in one message (the cutter)
      const segments = v.segments || [];
      if (!segments.length || segments.join(' ').trim() !== text.replace(/\s+/g, ' ').trim()) {
        rejected.push({ seedId: v.seedIds.join('+'), reason: 'segments-mismatch' });
        continue;
      }
      let offset = 0, ok = true, anyAmbiguous = false;
      const sp = v.surfacesPer || [];
      built.cohort = { operation: 'compound', recipeFamily: v.seedIds.join('+'), seed: v.seedIds[0] };
      for (let i = 0; i < v.seedIds.length; i++) {
        const seed = seeds.get(v.seedIds[i]);
        if (!seed) { rejected.push({ seedId: v.seedIds[i], reason: 'unknown-seed' }); ok = false; break; }
        const seg = segments[i];
        const res = buildRequest({ seed, segment: seg, offset, surfaces: sp[i] || {} });
        if (res.bad) { rejected.push({ seedId: v.seedIds[i], reason: res.bad }); ok = false; break; }
        if (res.ambiguous) { anyAmbiguous = true; break; }
        built.requests.push(res.request);
        built.requirements.push(...res.requirements, ...(res.deferred || []));
        built.seedIds.push(seed.seedId);
        offset += seg.length + 1; // the joining space
      }
      if (!ok) continue;
      if (anyAmbiguous) { quarantined.push({ seedId: v.seedIds.join('+'), reason: 'ambiguous-surface', text: text.slice(0, 60) }); continue; }
    } else { // single request
      const seed = seeds.get(v.seedId);
      if (!seed) { rejected.push({ seedId: v.seedId, reason: 'unknown-seed' }); continue; }
      const res = buildRequest({ seed, segment: text, offset: 0, surfaces: v.surfaces || {} });
      if (res.bad) { rejected.push({ seedId: v.seedId, reason: res.bad }); continue; }
      if (res.ambiguous) { quarantined.push({ seedId: v.seedId, reason: 'ambiguous-surface', text: text.slice(0, 60) }); continue; }
      built.requests = [res.request];
      built.requirements = [...(res.requirements || []), ...(res.deferred || [])];
      built.seedIds = [seed.seedId];
      built.cohort = { operation: seed.operation, recipeFamily: seed.seedId, seed: seed.seedId };
    }

    seenTexts.add(low);
    const isCompound = built.requests.length > 1;
    examples.push({
      format: 'psys2.synthetic-example/1',
      id: `syn-${base}-${String(examples.length).padStart(3, '0')}`,
      world: seeds.get(built.seedIds[0])?.area,
      text,
      context: { existing: [], previous: typeof v.previous === 'string' ? v.previous : null },
      requests: built.requests,
      tier: isCompound ? (tier === 'human-compound' ? 'human-compound' : 'compound') : tier,
      style: `synthetic-${tier}${isCompound ? '-compound' : ''}`,
      cohort: built.cohort,
      completion: { requirements: built.requirements, boundary: 'Completion values are not text-extraction gold.' },
      ambiguousSurfaces: [],
      nativeTool: null,
      provenance: `synthetic: skill generate-reader-datasets; seeds ${built.seedIds.join(', ')}; NOT execution-verified${tier.includes('typo') ? '; contains deliberate typos (labels stay canonical)' : ''}${tier.includes('syn') ? '; contains out-of-vocabulary synonyms (labels stay canonical)' : ''}`,
    });
  }
}
writeFileSync(OUT, examples.map((e) => JSON.stringify(e)).join('\n') + (examples.length ? '\n' : ''));
const count = (rows, key) => rows.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {});
writeFileSync(REPORT, JSON.stringify({
  accepted: examples.length, quarantined: quarantined.length, rejected: rejected.length,
  compounds: examples.filter((e) => e.requests.length > 1).length,
  rejectedSample: rejected.slice(0, 12), quarantinedSample: quarantined.slice(0, 6),
  byTier: count(examples, 'tier'), byWorld: count(examples, 'world'),
  byOperation: count(examples.map((e) => ({ op: e.cohort?.operation || '?' })), 'op'),
}, null, 1));
console.log(`accepted ${examples.length} (compounds ${examples.filter((e) => e.requests.length > 1).length}), quarantined ${quarantined.length}, rejected ${rejected.length} -> ${OUT} / ${REPORT}`);
