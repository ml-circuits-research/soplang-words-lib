// assemble.mjs — validate authored variants against their seeds and emit training
// examples on the ui-human schema. Validation is mechanical and jealous:
//   - every claimed constraint surface must appear in the text (first occurrence
//     becomes the span); more than one occurrence => quarantine (reported, not labeled);
//   - dropped optionals and vague optionals become completion.requirements, never gold;
//   - mandatory constraints, act, target kind are immutable; breaking them rejects;
//   - duplicate texts (in-set and against --reject-from corpora) are rejected;
//   - spans are computed here and only here.
//
// Usage:
//   node assemble.mjs --seeds seeds.jsonl --variants variants/   (a .jsonl file or a directory of them)
//                     [--reject-from old1.jsonl old2.jsonl]
//                     [--out examples.jsonl] [--report report.json]
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const seedsPath = arg('seeds');
const OUT = arg('out', 'examples.jsonl');
const REPORT = arg('report', 'report.json');
if (!seedsPath) { console.error('usage: assemble.mjs --seeds <jsonl> --variants <file|dir> [--reject-from ...]'); process.exit(1); }

// seeds: the skeletons whose labels are copied into every example
const seeds = new Map();
for (const line of readFileSync(seedsPath, 'utf8').trim().split('\n')) {
  if (!line) continue;
  const s = JSON.parse(line);
  seeds.set(s.seedId, s);
}

// reject-from: prior corpora whose exact texts may not reappear
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

// variant files: one .jsonl or a directory of them
const files = [];
{
  const v = arg('variants');
  if (!v || !existsSync(v)) { console.error('no variant files under --variants (expected a .jsonl file or a directory of them)'); process.exit(1); }
  if (v.endsWith('.jsonl')) files.push(v);
  else for (const f of readdirSync(v).sort()) if (f.endsWith('.jsonl')) files.push(`${v}/${f}`);
  if (!files.length) { console.error('no variant files under --variants'); process.exit(1); }
}

const examples = [], quarantined = [], rejected = [];
for (const f of files) {
  for (const line of readFileSync(f, 'utf8').trim().split('\n')) {
    let v; try { v = JSON.parse(line); } catch { rejected.push({ file: f, reason: 'bad-json' }); continue; }
    const seed = seeds.get(v.seedId);
    if (!seed) { rejected.push({ seedId: v.seedId, reason: 'unknown-seed' }); continue; }
    const text = String(v.text || '').trim();
    if (!text) { rejected.push({ seedId: v.seedId, reason: 'empty-text' }); continue; }
    const low = text.toLowerCase();
    if (seenTexts.has(low)) { rejected.push({ seedId: v.seedId, reason: 'duplicate' }); continue; }
    const spanAt = (needle) => {
      const idx = text.indexOf(needle);
      if (idx < 0) return { absent: true };
      return { start: idx, end: idx + needle.length, ambiguous: text.indexOf(needle, idx + 1) >= 0 };
    };
    const surfaces = v.surfaces || {};
    const constraintsOut = [], requirements = [];
    let bad = null, ambiguous = false;
    for (const c of seed.constraints) {
      const claimed = surfaces[String(c.n)];
      const isMandatory = !c.optional;
      if (claimed === null) {
        if (isMandatory) { bad = `dropped-mandatory:${c.key}`; break; }
        requirements.push({ key: c.key, requirement: 'omitted', seedValue: c.value });
        continue;
      }
      const vague = claimed && typeof claimed === 'object' && typeof claimed.vague === 'string' ? claimed.vague : null;
      if (vague && isMandatory) { bad = `vague-mandatory:${c.key}`; break; }
      const surface = vague ?? (claimed === undefined ? c.surface : String(claimed));
      const sp = spanAt(surface);
      if (sp.absent) {
        if (vague) { bad = `vague-surface-missing:${c.key}`; break; }
        if (isMandatory) { bad = `surface-missing:${c.key}:${String(surface).slice(0, 40)}`; break; }
        requirements.push({ key: c.key, requirement: 'omitted', seedValue: c.value });
        continue;
      }
      if (sp.ambiguous) { ambiguous = true; break; }
      constraintsOut.push({ key: c.key, value: vague ? null : c.value, value_span: [sp.start, sp.end], surface, operator: c.operator, phase: c.phase, polarity: c.polarity, character: vague ? 'preference' : 'requirement', ...(vague ? { qualitative: true } : {}) });
      if (vague) requirements.push({ key: c.key, requirement: 'vague', value: vague, seedValue: c.value });
    }
    const kindSurface = surfaces.kind ?? seed.target.kindValue;
    const ksp = spanAt(String(kindSurface));
    if (ksp.absent) bad = bad || `kind-missing:${kindSurface}`;
    else if (ksp.ambiguous) ambiguous = true;
    if (bad) { rejected.push({ seedId: v.seedId, reason: bad }); continue; }
    if (ambiguous) { quarantined.push({ seedId: v.seedId, reason: 'ambiguous-surface', text: text.slice(0, 60) }); continue; }
    seenTexts.add(low);
    examples.push({
      format: 'psys2.synthetic-example/1',
      id: `syn-${seed.seedId}-${String(examples.length).padStart(2, '0')}`,
      world: seed.area,
      text,
      context: { existing: [], previous: null },
      requests: [{
        span: text, trigger: v.trigger || (seed.canonicalText || '').split(' ')[0], act: seed.act, mood: 'do',
        target: { type: String(seed.on || 'drawn').split('.').pop(), mode: seed.target.mode, determiner: seed.target.mode === 'new' ? 'indefinite' : 'definite', kind: seed.target.kindValue, kind_span: [ksp.start, ksp.end] },
        constraints: constraintsOut,
      }],
      tier: v.tier || 'human-equivalent',
      style: `synthetic-${v.tier || 'human-equivalent'}`,
      cohort: { operation: seed.operation, recipeFamily: seed.seedId, seed: seed.seedId },
      completion: { requirements, boundary: 'Completion values are not text-extraction gold.' },
      ambiguousSurfaces: [],
      nativeTool: null,
      provenance: `synthetic: skill generate-reader-datasets; seed ${seed.seedId} (${seed.tier || 'ui-enum'}) enumerated from the native inventory; NOT execution-verified`,
    });
  }
}
writeFileSync(OUT, examples.map((e) => JSON.stringify(e)).join('\n') + (examples.length ? '\n' : ''));
const count = (rows, key) => rows.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {});
writeFileSync(REPORT, JSON.stringify({
  accepted: examples.length, quarantined: quarantined.length, rejected: rejected.length,
  rejectedSample: rejected.slice(0, 12), quarantinedSample: quarantined.slice(0, 6),
  byTier: count(examples, 'tier'), byWorld: count(examples, 'world'),
  bySeedTier: count(examples.map((e) => ({ tier: examples.find((x) => x.id === e.id) ? (seeds.get(e.cohort.seed)?.tier || '?') : '?' })), 'tier'),
  byOperation: count(examples.map((e) => ({ op: e.cohort.operation })), 'op'),
}, null, 1));
console.log(`accepted ${examples.length}, quarantined ${quarantined.length}, rejected ${rejected.length} -> ${OUT} / ${REPORT}`);
