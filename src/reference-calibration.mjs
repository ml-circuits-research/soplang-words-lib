import { str } from './parser.mjs';
import { fitsKind } from './matrix.mjs';

// A calculation owns its detached input data. Freezing protects that returned
// object, not the source world or a host's persistence/publication registry.
export function calibrateReference(world, id, options = {}) {
  return world._guard(options, () => {
    const tick = () => world._b.tick('validate');
    const family = options.family || 'std.reference', c = world._compiled();
    const fail = why => ({ ok: false, issues: [{ kind: 'reference-calibration', id: String(id), why }] });
    const first = (w, k) => w?.attrs[k]?.[0];
    const get = ref => typeof ref === 'string' && ref.startsWith('$') ? world.get(ref.slice(1)) : null;
    const reference = world.get(String(id).replace(/^\$/, ''));
    if (!reference || !c.isA(reference.type, family + '.set') || !world.schema(family + '.set')?.closed) return fail('reference set contract is not loaded');
    const checked = world.check();
    if (!checked.ok) return { ok: false, issues: checked.violations || checked.issues };
    const unit = first(reference, 'unit'), property = first(reference, 'property'), revision = first(reference, 'version');
    if (unit === undefined || property === undefined || revision === undefined) return fail('reference metadata is incomplete');
    const samples = [], evidence = [], pending = [], seenSamples = new Set(), seenEvidence = new Set();
    for (const ref of reference.attrs.member || []) {
      tick(); const sample = get(ref);
      if (!sample || !c.isA(sample.type, family + '.sample')) return fail('invalid sample reference');
      if (seenSamples.has(sample.id)) continue;
      seenSamples.add(sample.id);
      const value = first(sample, 'value');
      if (!fitsKind('number', value || '') || first(sample, 'unit') !== unit) return fail('sample must be finite and use the reference unit');
      const entry = { id: sample.id, value: Number(value), token: value, unit: str(unit) };
      const provenance = first(sample, 'provenance');
      if (provenance !== undefined) {
        const record = get(provenance); if (!record) return fail('missing sample provenance');
        entry.provenance = record.id; pending.push(record);
      }
      samples.push(Object.freeze(entry));
    }
    if (!samples.length) return fail('reference set must have samples');
    // Preserve the complete factual provenance closure. References inside these
    // copied records are snapshot-local data; no live lookup is needed later.
    for (let i = 0; i < pending.length; i++) {
      tick(); const record = pending[i];
      if (seenEvidence.has(record.id)) continue;
      seenEvidence.add(record.id);
      const attrs = Object.create(null);
      for (const [key, values] of Object.entries(record.attrs)) {
        tick(); const copied = [];
        for (const value of values) {
          tick(); copied.push(value);
          if (value.startsWith('$')) { const next = get(value); if (!next) return fail('missing provenance dependency'); pending.push(next); }
        }
        attrs[key] = Object.freeze(copied);
      }
      evidence.push(Object.freeze({ id: record.id, type: record.type, attrs: Object.freeze(attrs) }));
    }
    const values = samples.map(s => { tick(); return s.value; });
    values.sort((a, b) => { tick(); return a - b; });
    const middle = Math.floor(values.length / 2);
    let value = values[middle];
    if (values.length % 2 === 0) {
      const a = values[middle - 1], b = value;
      // Sum first to avoid half-difference underflow for subnormal pairs.
      // Only an overflowing same-sign sum needs separately halved operands.
      const sum = a + b;
      value = Number.isFinite(sum) ? sum / 2 : a / 2 + b / 2;
    }
    if (!Number.isFinite(value) || value <= 0) return fail('normalisation median must be finite and positive');
    const snapshot = Object.freeze({
      format: 'sop.reference.calibration', schemaVersion: 1, method: 'median', value, unit: str(unit),
      reference: Object.freeze({ id: reference.id, version: str(revision), property: str(property), unit: str(unit) }),
      samples: Object.freeze(samples), evidence: Object.freeze(evidence),
    });
    return { ok: true, snapshot, issues: [] };
  }, issue => ({ ok: false, issues: [issue] }));
}
