// Completing a structural binding table (format sop.structural-bindings/1: family, kind and property rows a reader
// was exported with, each aligned to a native capability) from the live capability declarations and declared rows.
// The table is exported once with a reader; the native interfaces (std.capability operations and parameters) and the
// application's declared bindings keep changing. Every completion is a rule the export itself uses or a declared row;
// nothing here names a word, a key, an area or an application.
//
// Inputs (plain rows the caller reads from its declarations):
//  parameters        [{world, sourceSha256, wire, operation, act, sourceType, parameter, kind, unit, enum}] — every
//                    std.capability.parameter of every native interface, with its operation's act, source type and
//                    declared coordinate unit; enum only when the value list is closed.
//  unboundParameters parameter names a key never binds to by its name (identity seeds, placement coordinates).
//  preferActs        acts whose operation a key bound by name takes first (in order), else the first declaring it.
//  families          declared family readings [{area, type, kind, authority}].
//  familyOperations  declared family operations [{area, type, operation, sourcePath}].
//  kindOperations    declared kind bindings [{id, area, kind, operation, parameter, value, sourceWorld, sourcePath, sourceSnapshotSHA, authority}].
//  keyAlignments     declared key alignments [{area, key, operation, parameter, codec, values:[{said, value}], authority}].
//  relations         declared relation pairs [{id, area, key, anchor, like, values, sourceWorld, authority}].
//  positions         declared positions [{area, key, sourceType, binding, sourceWire, sourceWorld, sourceSnapshotSHA, authority}].
//  ordinals          [{word, value}] the ordinal words of the language and their numbers (position values).
//  discriminator     the parameter a make operation tells its kinds apart by (a constructor policy's discriminator).
//  valueWords        Map value -> Set of words the catalog names that value with.
//  extra             fields added to the completed table as they are (declared length units).

const NUMERIC = ['number', 'integer'];
// Alignment kinds of the rows this module adds (as the export names its own).
const ALIGN_COMPOUND_LEMMA_MODIFIER = 'compound-lemma-modifier';
const ALIGN_DECLARED_KEY_PARAMETER = 'declared-key-parameter';
const ALIGN_DECLARED_POSITION = 'declared-position';
const ALIGN_DECLARED_RELATION_PAIR = 'declared-relation-pair';
const ALIGN_EXPLICIT_RAW_FAMILY_IDENTITY = 'explicit-raw-family-identity';
const ALIGN_NATIVE_ENUM_VALUE = 'native-enum-value';
const ALIGN_NATIVE_PARAMETER_BY_NAME = 'native-parameter-by-name';
const ALIGN_RELATION = 'relation';
const ALIGN_RELATION_ANCHOR = 'relation-anchor';


// A declared parameter value typed as the parameter takes it (a boolean, a number, else the string itself).
const typed = (kind, value) => kind === 'boolean' ? value === 'true' : NUMERIC.includes(kind) && Number.isFinite(Number(value)) ? Number(value) : value;

function nativeValueKinds(kinds, params, declared) {
  const own = declared.discriminator, bindings = declared.kindOperations ?? [], words = declared.valueWords ?? new Map(), out = [];
  // Each family's make operations and their discriminators: its rows' own bindings (the discriminator) and the declared
  // kind bindings of its rows (their parameter).
  const families = new Map();
  for (const k of kinds) {
    const key = k.area + '\0' + k.type;
    if (!families.has(key)) families.set(key, { area: k.area, type: k.type, lemmas: new Set(), canonicals: new Set(), ops: new Map() });
    const f = families.get(key);
    f.lemmas.add(String(k.lemma).toLowerCase()); f.canonicals.add(k.canonical);
    if (k.nativeFamilyBinding?.operation && own) f.ops.set(k.nativeFamilyBinding.operation + '\0' + own, { operation: k.nativeFamilyBinding.operation, parameter: own });
    for (const d of bindings) if (d.area === k.area && d.kind === k.canonical && d.parameter) f.ops.set(d.operation + '\0' + d.parameter, { operation: d.operation, parameter: d.parameter });
  }
  for (const f of families.values()) for (const { operation, parameter } of f.ops.values()) {
    const p = params.find((x) => x.operation === operation && x.parameter === parameter && x.enum);
    if (!p) continue;
    for (const value of p.enum) {
      const spaced = value.replace(/_/g, ' ');
      if (f.lemmas.has(value) || f.lemmas.has(spaced)) continue;
      const d = bindings.find((x) => x.area === f.area && x.operation === operation && x.parameter === parameter && x.value === value);
      // A value whose declared kind the family already names is that kind's (a modifier is completion 6's).
      if (bindings.some((x) => x.area === f.area && x.operation === operation && x.parameter === parameter && x.value === value && f.canonicals.has(x.kind))) continue;
      const canonical = d ? d.kind : p.sourceType + '.' + parameter + '.' + value;
      const base = { area: f.area, type: f.type, canonical, sourceWire: d ? d.id : p.wire, sourceSnapshotSHA: p.sourceSha256, sourceWorld: d ? d.sourceWorld : p.world, moduleVersion: '1',
        alignment: { kind: ALIGN_NATIVE_ENUM_VALUE, authority: 'sopworld completeStructuralBindings: a closed native value no kind row names', operation, parameter, value },
        ...(d ? {} : { nativeFamilyBinding: { operation, sourceType: p.sourceType, arguments: { [parameter]: value }, boundary: 'Declared native value: the kind is drawn by this operation with this value.' } }) };
      for (const lemma of new Set([value, spaced, ...(words.get(value) ?? [])])) {
        if (f.lemmas.has(lemma)) continue;
        f.lemmas.add(lemma);
        out.push({ ...base, lemma, rawDescriptor: { area: f.area, type: f.type, kind: lemma } });
      }
    }
  }
  return out;
}

/**
 * The binding table completed from the live capability declarations and the declared rows (see the head of this
 * module). Returns a new frozen table; the input is not changed.
 */
export function completeStructuralBindings(bindings, declared = {}) {
  if (!bindings || typeof bindings !== 'object') return bindings;
  const params = declared.parameters ?? [];
  const unbound = new Set(declared.unboundParameters ?? []), preferActs = declared.preferActs ?? [];
  const kindOperations = declared.kindOperations ?? [];
  const enumOf = (sourceType, parameter) => params.find((p) => p.sourceType === sourceType && p.parameter === parameter && p.enum)?.enum ?? null;
  // A property whose native parameter is a number on its source type is numeric: a reader takes the one number its
  // value span spells.
  const numericOf = (sourceType, parameter) => params.some((p) => p.sourceType === sourceType && p.parameter === parameter && NUMERIC.includes(p.kind));
  // The length unit of a numeric parameter (its operation's declared coordinate unit), for a value said with a unit.
  const unitOf = (sourceType, parameter) => params.find((p) => p.sourceType === sourceType && p.parameter === parameter && NUMERIC.includes(p.kind) && p.unit)?.unit;
  const byName = (area, key, sourceType, parameter, p, authority) => ({ area, key, valueKind: 'string', canonical: sourceType + '.' + parameter, sourceWire: p.wire, sourceSnapshotSHA: p.sourceSha256, sourceWorld: p.world, moduleVersion: '1',
    hostBinding: { id: p.operation, sourceType, key: parameter, operation: p.operation, parameter }, ...(p.enum ? { classValues: p.enum } : numericOf(sourceType, parameter) ? { numeric: true } : {}),
    alignment: { kind: ALIGN_NATIVE_PARAMETER_BY_NAME, authority } });
  // 2. Closed value lists, numbers and units of the native parameters properties are bound to.
  const properties = (bindings.properties ?? []).map((row) => {
    const values = row.hostBinding && !row.classValues ? enumOf(row.hostBinding.sourceType, row.hostBinding.parameter) : null;
    const numeric = row.hostBinding && !values && !row.classValues && row.numeric === undefined && numericOf(row.hostBinding.sourceType, row.hostBinding.parameter);
    const unit = numeric && unitOf(row.hostBinding.sourceType, row.hostBinding.parameter);
    return values || numeric ? { ...row, ...(values ? { classValues: values } : {}), ...(numeric ? { numeric: true } : {}), ...(unit ? { unit } : {}) } : row;
  });
  // 1. A key left unbound for want of a native parameter binds to the parameter of its own name on its family's one source type.
  for (const gap of bindings.coverage ?? []) {
    if (gap.status !== 'unbound' || gap.reason !== 'no-native-parameter' || typeof gap.key !== 'string' || !gap.key.includes('.')) continue;
    if (properties.some((row) => row.area === gap.area && row.key === gap.key)) continue;
    const [type, parameter] = gap.key.split('.');
    const types = new Set((bindings.properties ?? []).filter((row) => row.area === gap.area && row.key.startsWith(type + '.') && row.hostBinding?.sourceType).map((row) => row.hostBinding.sourceType));
    if (types.size !== 1) continue;
    const [sourceType] = types, p = params.find((x) => x.sourceType === sourceType && x.parameter === parameter);
    if (!p) continue;
    properties.push(byName(gap.area, gap.key, sourceType, parameter, p, 'sopworld completeStructuralBindings: the export rule over the live native interface'));
  }
  // 5. Declared key alignments replace the table's row for their key; declared said values are the class values, each
  // given to the tool as its declared parameter value (valueMap).
  for (const d of declared.keyAlignments ?? []) {
    const p = params.find((x) => x.operation === d.operation && x.parameter === d.parameter);
    if (!p) continue;
    const sourceType = p.sourceType, valueMap = d.values?.length ? d.values.map((v) => ({ said: v.said, value: typed(p.kind, v.value) })) : null;
    const row = { area: d.area, key: d.key, valueKind: 'string', canonical: sourceType + '.' + d.parameter, sourceWire: p.wire, sourceSnapshotSHA: p.sourceSha256, sourceWorld: p.world, moduleVersion: '1',
      hostBinding: { id: p.operation, sourceType, key: d.parameter, operation: p.operation, parameter: d.parameter, ...(d.codec ? { codec: d.codec } : {}) },
      ...(valueMap ? { classValues: valueMap.map((v) => v.said), valueMap } : p.enum ? { classValues: p.enum } : numericOf(sourceType, d.parameter) ? { numeric: true } : {}),
      alignment: { kind: ALIGN_DECLARED_KEY_PARAMETER, authority: d.authority } };
    const at = properties.findIndex((r) => r.area === d.area && r.key === d.key);
    if (at >= 0) properties[at] = row; else properties.push(row);
  }
  // 1b. Declared relation pairs: a relation key and its anchor key take the projection roles of the like= key.
  for (const r of declared.relations ?? []) {
    const like = properties.find((row) => row.key === r.like && row.projection?.kind === 'relation');
    const likeAnchor = like && properties.find((row) => row.area === like.area && row.projection?.kind === 'relation-anchor');
    if (!like || !likeAnchor) continue;
    const provenance = { sourceWire: r.id, sourceWorld: r.sourceWorld, moduleVersion: '1', sourceSnapshotSHA: like.sourceSnapshotSHA, alignment: { kind: ALIGN_DECLARED_RELATION_PAIR, authority: r.authority } };
    for (const row of [{ key: r.key, canonical: like.canonical, valueKind: like.valueKind, projection: { kind: ALIGN_RELATION, values: r.values } }, { key: r.anchor, canonical: likeAnchor.canonical, valueKind: likeAnchor.valueKind, projection: { kind: ALIGN_RELATION_ANCHOR } }]) {
      const at = properties.findIndex((p) => p.area === r.area && p.key === row.key);
      const made = { area: r.area, ...row, ...provenance };
      if (at < 0) properties.push(made); else if (!properties[at].projection) properties[at] = made;
      // A key the table already pairs keeps its row; the declaration adds relation values it lacks.
      else if (properties[at].projection.kind === 'relation' && row.projection.kind === 'relation')
        properties[at] = { ...properties[at], projection: { ...properties[at].projection, values: { ...row.projection.values, ...properties[at].projection.values } } };
    }
  }
  // 3. Declared family readings: a family the table leaves unresolved reads as its declared class, with the provenance
  // of that class's kind row, else (a class published after the export) of the kind binding that makes it.
  const families = [...(bindings.families ?? [])];
  for (const f of declared.families ?? []) {
    if (families.some((row) => row.area === f.area && row.type === f.type)) continue;
    const kind = (bindings.kinds ?? []).find((row) => row.area === f.area && row.canonical === f.kind);
    if (kind) {
      families.push({ area: f.area, type: f.type, canonical: kind.canonical, sourceWire: kind.sourceWire, sourceWorld: kind.sourceWorld, moduleVersion: kind.moduleVersion, sourceSnapshotSHA: kind.sourceSnapshotSHA,
        alignment: { kind: ALIGN_EXPLICIT_RAW_FAMILY_IDENTITY, authority: f.authority } });
      continue;
    }
    const d = kindOperations.find((x) => x.area === f.area && x.kind === f.kind);
    if (d) families.push({ area: f.area, type: f.type, canonical: f.kind, sourceWire: d.id, sourceWorld: d.sourceWorld, moduleVersion: '1', sourceSnapshotSHA: d.sourceSnapshotSHA,
      alignment: { kind: ALIGN_EXPLICIT_RAW_FAMILY_IDENTITY, authority: [f.authority, d.authority].filter(Boolean).join('; ') } });
  }
  // 3b. Declared family operations: a family the table gives no operation binds to the declared one and its source type.
  for (const d of declared.familyOperations ?? []) {
    const at = families.findIndex((f) => f.area === d.area && f.type === d.type && !f.nativeFamilyBinding);
    const p = params.find((x) => x.operation === d.operation);
    if (at < 0 || !p) continue;
    families[at] = { ...families[at], nativeFamilyBinding: { operation: d.operation, sourceType: p.sourceType, sourcePath: d.sourcePath, boundary: 'Family eligibility only (declared family operation).' } };
  }
  // 4. A family named without a kind word denotes any object of its source type: a family without a native family
  // binding takes the one binding its own kind rows share (own, or the operation of a declared kind binding).
  for (const [index, f] of families.entries()) {
    if (f.nativeFamilyBinding) continue;
    const shared = new Map();
    for (const k of bindings.kinds ?? []) {
      if (k.area !== f.area || k.type !== f.type) continue;
      const own = k.nativeFamilyBinding?.operation && k.nativeFamilyBinding.sourceType ? k.nativeFamilyBinding : null;
      const ds = own ? null : kindOperations.filter((d) => d.area === k.area && d.kind === k.canonical);
      const operation = own?.operation ?? (ds?.length === 1 ? ds[0].operation : undefined);
      const sourceType = own?.sourceType ?? params.find((p) => p.operation === operation)?.sourceType;
      if (!operation || !sourceType) continue;
      const sourcePath = ds?.length === 1 ? ds[0].sourcePath : undefined;
      // The family's own class as a kind keeps that kind's arguments.
      const args = k.canonical === f.canonical ? (own?.arguments ?? (ds?.length === 1 && ds[0].parameter ? { [ds[0].parameter]: ds[0].value } : undefined)) : undefined;
      if (args) { shared.clear(); shared.set('own', { ...(own ?? { operation, sourceType, sourcePath }), arguments: args }); break; }
      shared.set(sourceType + '\0' + operation, own ?? { operation, sourceType, sourcePath });
    }
    // 4b. A family with no kind rows of its own takes the operation its class's declared kind binding names.
    if (!shared.size && !(bindings.kinds ?? []).some((k) => k.area === f.area && k.type === f.type)) {
      const ds = kindOperations.filter((d) => d.area === f.area && d.kind === f.canonical);
      const sourceType = ds.length === 1 ? params.find((p) => p.operation === ds[0].operation)?.sourceType : undefined;
      if (sourceType) shared.set(sourceType + '\0' + ds[0].operation, { operation: ds[0].operation, sourceType, sourcePath: ds[0].sourcePath });
    }
    if (shared.size !== 1) continue;
    const [b] = shared.values();
    const binding = { operation: b.operation, sourceType: b.sourceType, exportName: b.exportName, sourcePath: b.sourcePath, sourceSha256: b.sourceSha256, arguments: b.arguments,
      boundary: 'Family eligibility only (the binding its kind rows share).' };
    families[index] = { ...f, nativeFamilyBinding: Object.fromEntries(Object.entries(binding).filter(([, value]) => value !== undefined)) };
  }
  // 4c. A key left unbound for want of a native source type binds, once its family has one, to the parameter of its own name.
  for (const gap of bindings.coverage ?? []) {
    if (gap.status !== 'unbound' || gap.reason !== 'no-native-source-type' || typeof gap.key !== 'string' || !gap.key.includes('.')) continue;
    if (properties.some((row) => row.area === gap.area && row.key === gap.key)) continue;
    const [type, parameter] = gap.key.split('.'), family = families.find((f) => f.area === gap.area && f.type === type && f.nativeFamilyBinding?.sourceType);
    if (!family) continue;
    const sourceType = family.nativeFamilyBinding.sourceType, p = params.find((x) => x.sourceType === sourceType && x.parameter === parameter);
    if (!p) continue;
    properties.push(byName(gap.area, gap.key, sourceType, parameter, p, 'sopworld completeStructuralBindings: the export rule over the live native interface and the declared family'));
  }
  // 7. Declared positions: the key of a member's place, observed on its source type, takes the ordinal numbers.
  const valueNormalizations = [...(bindings.valueNormalizations ?? [])];
  for (const row of declared.positions ?? []) {
    if (properties.some((p) => p.area === row.area && p.key === row.key && p.alignment?.kind !== 'declared-position')) continue;
    const parameter = row.binding.split('.').at(-1), canonical = row.sourceType + '.' + parameter;
    const provenance = { sourceWire: row.sourceWire, sourceSnapshotSHA: row.sourceSnapshotSHA, sourceWorld: row.sourceWorld, moduleVersion: '1' };
    properties.push({ area: row.area, key: row.key, valueKind: 'string', canonical, ...provenance, numeric: true,
      hostBinding: { id: row.binding, sourceType: row.sourceType, key: parameter, parameter },
      alignment: { kind: ALIGN_DECLARED_POSITION, authority: row.authority } });
    for (const { word, value } of declared.ordinals ?? []) {
      if (!Number.isSafeInteger(value) || value < 1) continue;
      valueNormalizations.push({ area: row.area, key: row.key, canonical, source: word, value: String(value), valueKind: 'string', ...provenance });
    }
  }
  // 6. A kind named by the modifier of its compound lemmas (the compound's last word a lemma of its family's own class),
  // when every such compound names the same kind.
  let kinds = bindings.kinds ?? [];
  const modifiers = new Map();
  for (const f of families) {
    const heads = new Set(kinds.filter((k) => k.area === f.area && k.type === f.type && k.canonical === f.canonical).map((k) => k.lemma));
    if (!heads.size) continue;
    for (const k of kinds) {
      if (k.area !== f.area || k.type !== f.type || k.canonical === f.canonical || typeof k.lemma !== 'string') continue;
      const words = k.lemma.split(' ');
      if (words.length < 2 || !heads.has(words.at(-1))) continue;
      const lemma = words.slice(0, -1).join(' '), key = f.area + '\0' + f.type + '\0' + lemma;
      if (!modifiers.has(key)) modifiers.set(key, { lemma, rows: [] });
      modifiers.get(key).rows.push(k);
    }
  }
  const added = [];
  for (const [key, { lemma, rows }] of modifiers) {
    const [area, type] = key.split('\0');
    if (new Set(rows.map((r) => r.canonical)).size !== 1 || kinds.some((k) => k.area === area && k.type === type && k.lemma === lemma)) continue;
    added.push({ ...rows[0], lemma, alignment: { kind: ALIGN_COMPOUND_LEMMA_MODIFIER, authority: 'sopworld completeStructuralBindings: the modifier of compound lemmas', compound: rows[0].lemma } });
  }
  if (added.length) kinds = [...kinds, ...added];
  // 8. Kinds for the closed native values of a family's make operation that no kind row names.
  const enumKinds = nativeValueKinds(kinds, params, declared);
  if (enumKinds.length) kinds = [...kinds, ...enumKinds];
  // 9. A key the table predates binds by the export's own rule: <family type>.<parameter> to the parameter of that name
  // on the family's source type (an operation of a preferred act first, else the first declaring it).
  for (const f of families) {
    const sourceType = f.nativeFamilyBinding?.sourceType;
    if (!sourceType) continue;
    const ofType = params.filter((p) => p.sourceType === sourceType && p.parameter && !unbound.has(p.parameter));
    for (const parameter of new Set(ofType.map((p) => p.parameter))) {
      const key = f.type + '.' + parameter;
      if (properties.some((row) => row.area === f.area && row.key === key)) continue;
      const choices = ofType.filter((q) => q.parameter === parameter);
      const p = preferActs.map((act) => choices.find((q) => q.act === act)).find(Boolean) ?? choices[0];
      properties.push(byName(f.area, key, sourceType, parameter, p, 'sopworld completeStructuralBindings: the export rule for keys the table predates'));
    }
  }
  return Object.freeze({ ...bindings, properties, families, kinds, valueNormalizations, ...(declared.extra ?? {}) });
}
