// A domain-general semantic frame (docs/semantic-frame.md): what a reader says about one message in a fixed role set
// that is the same for every area (action, theme mentions, attributes, spatial relations, motion, goal, time, manner,
// structure, question), and its compilation to std.request graphs through declared capabilities. The area is context,
// never part of a label. A role binds when the declarations name an operation and a parameter for it (a
// std.capability.property row: concept, on, parameter); a role that does not bind is disclosed, never guessed, and the
// rest of the request still compiles (partial execution).
import { quote, readValue } from './parser.mjs';

export const FRAME_FORMAT = 'sop.semantic-frame/1';

/** The role heads and their closed value banks (open roles take spans or concept names). */
export const FRAME_ROLES = Object.freeze({
  act: ['make', 'change', 'place', 'remove', 'connect', 'arrange', 'swap', 'copy', 'group', 'ungroup', 'select', 'answer', 'undo', 'redo', 'compose', 'converse', 'show'],
  mood: ['do', 'ask', 'check', 'propose'],
  polarity: ['positive', 'negative'],
  determiner: ['definite', 'indefinite', 'demonstrative', 'possessive', 'another', 'other', 'every', 'none'],
  reference: ['new', 'name', 'description', 'anaphora', 'population', 'ordinal', 'code', 'context'],
  mentionRole: ['theme', 'landmark', 'goal', 'possessor', 'member'],
  operator: ['eq', 'degree', 'delta', 'factor', 'relation', 'region'],
  step: ['more', 'much_more', 'less', 'much_less'],
  phase: ['result', 'selector'],
  direction: ['up', 'down', 'left', 'right', 'closer', 'apart', 'forward', 'backward', 'in', 'out'],
  fragment: ['adds', 'replaces', 'repeats', 'more', 'less', 'confirms', 'rejects'],
  discourse: ['thanks', 'greeting', 'complaint', 'correction', 'repetition', 'confirmation', 'rejection'],
  question: ['count', 'exists', 'list', 'what', 'which', 'where', 'describe', 'why', 'how'],
  relation: ['sequence', 'condition', 'instead'],
  degree: ['bit', 'much'],
  timeRole: ['start', 'end', 'day', 'duration', 'recurrence'],
});

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const atomLike = (v) => typeof v === 'string' && /^[A-Za-z_][A-Za-z0-9_.-]*$/.test(v);
const numberLike = (v) => typeof v === 'number' ? Number.isFinite(v) : typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v);
const atomOf = (v) => String(v).trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
const token = (v) => numberLike(v) ? String(v) : atomLike(v) && readValue(v).kind === 'atom' ? v : quote(String(v));

/** Structural check of a frame: shapes, banks, indices. No vocabulary, no truth. */
export function inspectFrame(frame, { budget = 20000 } = {}) {
  const issues = [];
  let steps = 0;
  const tick = () => { if (++steps > budget) throw { frameBudget: true }; };
  const bad = (path, reason) => issues.push({ path, reason });
  const bank = (value, name, path) => { tick(); if (value !== undefined && !FRAME_ROLES[name].includes(value)) bad(path, 'not-in-bank:' + name); };
  try {
    if (!isObj(frame) || frame.format !== FRAME_FORMAT) return { ok: false, issues: [{ path: [], reason: 'invalid-format' }] };
    if (typeof frame.text !== 'string') bad(['text'], 'text-required');
    if (!Array.isArray(frame.clauses)) return { ok: false, issues: [...issues, { path: ['clauses'], reason: 'clauses-required' }] };
    frame.clauses.forEach((clause, c) => {
      tick();
      const at = ['clauses', c];
      if (!isObj(clause)) return bad(at, 'invalid-clause');
      if (clause.span !== undefined && typeof frame.text === 'string' && !frame.text.includes(clause.span)) bad([...at, 'span'], 'span-not-in-text');
      const action = clause.action || {};
      bank(action.act, 'act', [...at, 'action', 'act']);
      bank(action.mood, 'mood', [...at, 'action', 'mood']);
      bank(action.polarity, 'polarity', [...at, 'action', 'polarity']);
      bank(clause.fragment, 'fragment', [...at, 'fragment']);
      bank(clause.discourse, 'discourse', [...at, 'discourse']);
      if (clause.question) bank(clause.question.type, 'question', [...at, 'question', 'type']);
      const mentions = clause.mentions || [];
      if (!Array.isArray(mentions)) return bad([...at, 'mentions'], 'mentions-must-be-list');
      const mention = (i, path) => { tick(); if (!Number.isInteger(i) || i < 0 || i >= mentions.length) bad(path, 'mention-index'); };
      mentions.forEach((m, i) => {
        tick();
        const mp = [...at, 'mentions', i];
        if (!isObj(m)) return bad(mp, 'invalid-mention');
        if (typeof m.head !== 'string' && typeof m.kind !== 'string' && typeof m.name !== 'string' && typeof m.code !== 'string' && m.reference !== 'anaphora' && m.reference !== 'population') bad(mp, 'mention-needs-head-kind-name-or-code');
        bank(m.determiner, 'determiner', [...mp, 'determiner']);
        bank(m.reference, 'reference', [...mp, 'reference']);
        bank(m.role, 'mentionRole', [...mp, 'role']);
        if (m.possessor !== undefined) { mention(m.possessor, [...mp, 'possessor']); if (m.possessor === i) bad(mp, 'own-possessor'); }
        if (m.quantity !== undefined) {
          const q = m.quantity;
          if (!isObj(q) || !(Number.isInteger(q.number) && q.number >= 0 || typeof q.vague === 'string' || q.all === true)) bad([...mp, 'quantity'], 'invalid-quantity');
        }
        if (m.antecedent !== undefined && !(isObj(m.antecedent) && Number.isInteger(m.antecedent.clause) && m.antecedent.clause < c && Number.isInteger(m.antecedent.mention))) bad([...mp, 'antecedent'], 'antecedent-must-name-an-earlier-clause');
      });
      for (const [i, a] of (clause.attributes || []).entries()) {
        const ap = [...at, 'attributes', i];
        mention(a.theme, [...ap, 'theme']);
        if (typeof a.concept !== 'string' || !a.concept) bad(ap, 'concept-required');
        bank(a.operator, 'operator', [...ap, 'operator']);
        bank(a.step, 'step', [...ap, 'step']);
        bank(a.phase, 'phase', [...ap, 'phase']);
        if (a.operator === 'delta' && a.step === undefined && !numberLike(a.value)) bad(ap, 'delta-needs-step-or-number');
      }
      for (const [i, s] of (clause.spatial || []).entries()) {
        const sp = [...at, 'spatial', i];
        mention(s.theme, [...sp, 'theme']);
        if (s.landmark !== undefined) mention(s.landmark, [...sp, 'landmark']);
        if (!s.relation && !s.region) bad(sp, 'relation-or-region-required');
        if (s.relation && s.landmark === undefined) bad(sp, 'relation-needs-landmark');
      }
      for (const [i, m] of (clause.motion || []).entries()) {
        mention(m.theme, [...at, 'motion', i, 'theme']);
        bank(m.direction, 'direction', [...at, 'motion', i, 'direction']);
      }
      for (const [i, g] of (clause.goal || []).entries()) {
        mention(g.theme, [...at, 'goal', i, 'theme']);
        if (typeof g.concept !== 'string' && g.mention === undefined) bad([...at, 'goal', i], 'goal-needs-concept-or-mention');
        if (g.mention !== undefined) mention(g.mention, [...at, 'goal', i, 'mention']);
      }
      for (const [i, t] of (clause.time || []).entries()) bank(t.role, 'timeRole', [...at, 'time', i, 'role']);
      for (const [i, m] of (clause.manner || []).entries()) {
        if (typeof m.objective !== 'string') bad([...at, 'manner', i], 'objective-required');
        bank(m.degree, 'degree', [...at, 'manner', i, 'degree']);
      }
    });
    for (const [i, r] of (frame.structure?.relations || []).entries()) {
      tick();
      bank(r.type, 'relation', ['structure', 'relations', i, 'type']);
      if (![r.from, r.to].every((n) => Number.isInteger(n) && n >= 0 && n < frame.clauses.length) || r.from === r.to) bad(['structure', 'relations', i], 'clause-index');
    }
  } catch (error) {
    if (error?.frameBudget) return { ok: false, issues: [{ path: [], reason: 'budget' }] };
    throw error;
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Complete a fragment from the previous message's frame (frame.previous.frame): the fragment keeps the previous
 * clause's action and themes and adds (adds), replaces (replaces) or repeats its roles; "more"/"less" repeat the
 * previous attributes and motions one step further. A frame without a fragment is returned unchanged.
 */
export function completeFragment(frame) {
  const previous = frame?.previous?.frame?.clauses?.at(-1);
  if (!previous) return frame;
  const clauses = frame.clauses.map((clause) => {
    if (!clause.fragment || ['confirms', 'rejects'].includes(clause.fragment)) return clause;
    const base = structuredClone(previous);
    if (clause.fragment === 'repeats') return { ...base, span: clause.span ?? base.span, fragment: clause.fragment };
    if (clause.fragment === 'more' || clause.fragment === 'less') {
      const step = clause.fragment;
      return { ...base, span: clause.span ?? base.span, fragment: step,
        attributes: (base.attributes || []).map((a) => ({ ...a, operator: 'delta', step, value: undefined })),
        motion: (base.motion || []).map((m) => ({ ...m, amount: { degree: step } })) };
    }
    // adds / replaces. A fragment with a theme of its own ("and a dog", "now a red one") keeps the previous action;
    // one without ("on the lake", "bigger") applies its roles to the previous theme.
    const own = clause.mentions || [];
    if (own.some((m) => (m.role || 'theme') === 'theme')) return { ...clause, action: { ...base.action, ...(clause.action || {}) }, fragment: clause.fragment };
    const offset = (base.mentions || []).length;
    const theme = (base.mentions || []).findIndex((m) => (m.role || 'theme') === 'theme');
    const merged = { ...base, span: clause.span ?? base.span, fragment: clause.fragment, mentions: [...(base.mentions || []), ...own] };
    for (const role of ['attributes', 'spatial', 'motion', 'goal', 'time', 'manner']) {
      const extra = (clause[role] || []).map((r) => ({ ...r, theme: Math.max(theme, 0),
        ...(r.landmark !== undefined ? { landmark: r.landmark + offset } : {}),
        ...(r.mention !== undefined ? { mention: r.mention + offset } : {}) }));
      if (!extra.length) continue;
      const key = (r) => r.concept ?? r.relation ?? r.region ?? r.direction ?? r.objective ?? role;
      const replaced = new Set(extra.map(key));
      merged[role] = [...(base[role] || []).filter((r) => clause.fragment !== 'replaces' || !replaced.has(key(r))), ...extra];
    }
    return merged;
  });
  return { ...frame, clauses };
}

/** Read the capability declarations of one std.capability scope of a World as a plain table for bindFrame. */
export function capabilityTable(world, scope) {
  const get = (w, k) => w?.attrs[k]?.[0];
  const text = (w, k) => { const v = get(w, k); return v === undefined ? undefined : readValue(v).v; };
  const inScope = (w) => !get(w, 'scope') || get(w, 'scope') === '$' + scope;
  const ops = world.ofType('std.capability.operation').filter(inScope);
  const params = world.ofType('std.capability.parameter');
  return {
    operations: ops.map((op) => ({ name: text(op, 'name'), act: text(op, 'act'), on: text(op, 'on'),
      parameters: params.filter((p) => get(p, 'operation') === '$' + op.id).map((p) => text(p, 'name')) })),
    kinds: world.ofType('std.capability.target').filter(inScope).map((t) => {
      const op = world.get(String(get(t, 'operation')).slice(1));
      return { label: text(t, 'label'), canonical: text(t, 'canonical'), on: text(op, 'on') };
    }),
    properties: world.ofType('std.capability.property').filter(inScope).map((p) => ({ concept: text(p, 'concept'), on: text(p, 'on'), parameter: text(p, 'parameter') })),
    repeats: world.ofType('std.capability.repeat').filter(inScope).map((r) => ({ on: text(r, 'on'), act: text(r, 'act'), concept: text(r, 'concept'), max: Number(text(r, 'max')) })),
    objects: world.ofType('std.capability.object').filter(inScope).map((o) => ({ id: text(o, 'id'), kind: text(o, 'kind'), name: text(o, 'name'), on: text(o, 'on') })),
  };
}

const lower = (s) => typeof s === 'string' ? s.toLowerCase().trim() : s;

/**
 * Bind every role of a frame against a capability table:
 *   { operations:[{name,act,on,parameters}], kinds:[{label,canonical,on}], properties:[{concept,on,parameter}],
 *     repeats:[{on,act,concept,max}], objects:[{id,kind,name,on}], relations:[on], amounts:[{name,typical}],
 *     actForms:[{act,mode,as}], concepts:{alias:concept} }
 * Returns, per clause, the theme bindings and, per role, `bound` (operation and parameter, or the placement or
 * repeat mechanism that takes it) or `unbound` with a reason. Nothing is inferred from names: a role binds only
 * through a declared row.
 */
export function bindFrame(frame, table, { budget = 50000 } = {}) {
  let steps = 0;
  const tick = () => { if (++steps > budget) throw Error('frame-binding-budget'); };
  const concept = (c) => table.concepts?.[c] ?? c;
  const amounts = new Map((table.amounts || []).map((a) => [lower(a.name), a]));
  const clauses = frame.clauses.map((clause, c) => {
    const action = clause.action || {};
    const mentions = clause.mentions || [];
    const resolved = mentions.map((m, i) => resolveMention(table, frame, c, m, i, tick));
    const roles = [];
    const themes = mentions.map((m, i) => ({ m, i })).filter(({ m }) => (m.role || 'theme') === 'theme');
    const bindings = new Map();
    for (const { m, i } of themes) {
      tick();
      const r = resolved[i];
      const mode = isNew(m) ? 'new' : 'existing';
      const form = (table.actForms || []).find((f) => f.act === action.act && f.mode === mode);
      const act = form?.as ?? action.act;
      const ops = (table.operations || []).filter((op) => { tick(); return op.act === act && r.on.includes(op.on); });
      bindings.set(i, { mention: i, mode, act, kind: r.kind, on: [...new Set(ops.map((op) => op.on))], operations: ops.map((op) => op.name), ...(r.reason ? { reason: r.reason } : {}) });
      roles.push({ role: 'theme', mention: i, ...(ops.length ? { bound: { operations: ops.map((op) => op.name), kind: r.kind } } : { unbound: r.reason || (r.on.length ? 'no-operation-for-act' : 'kind-not-declared') }) });
      if (m.quantity && ops.length) {
        const q = m.quantity, n = q.number ?? amounts.get(lower(q.vague))?.typical;
        const count = (table.properties || []).find((p) => p.concept === 'count' && bindings.get(i).on.includes(p.on) && ops.some((op) => op.on === p.on && op.parameters.includes(p.parameter)));
        const repeat = (table.repeats || []).find((rr) => rr.concept === 'count' && rr.act === act && bindings.get(i).on.includes(rr.on));
        if (q.all) roles.push({ role: 'quantity', mention: i, bound: { population: true } });
        else if (n === undefined) roles.push({ role: 'quantity', mention: i, unbound: 'vague-amount-not-declared' });
        else if (count) roles.push({ role: 'quantity', mention: i, bound: { parameter: count.parameter, count: n, ...(q.vague ? { vague: q.vague } : {}) } });
        else if (repeat && n <= repeat.max) roles.push({ role: 'quantity', mention: i, bound: { repeat: n, ...(q.vague ? { vague: q.vague } : {}) } });
        else roles.push({ role: 'quantity', mention: i, unbound: 'no-count-capability' });
      }
      for (const mod of m.modifiers || []) roles.push({ role: 'modifier', mention: i, span: mod, unbound: 'modifier-needs-attribute-concept' });
      if (m.possessor !== undefined) {
        const whole = resolved[m.possessor];
        roles.push({ role: 'possessor', mention: i, ...(whole.on.length ? { bound: { kind: whole.kind } } : { unbound: whole.reason || 'possessor-not-declared' }) });
      }
    }
    const theme = (i) => bindings.get(i) ?? bindings.get(themes[0]?.i);
    const property = (name, b) => (table.properties || []).find((p) => {
      tick();
      return p.concept === concept(name) && b.on.includes(p.on) && (table.operations || []).some((op) => b.operations.includes(op.name) && op.on === p.on && op.parameters.includes(p.parameter));
    });
    const bindProperty = (role, index, name, extra = {}) => {
      const b = theme(index.theme);
      if (!b || !b.operations.length) return roles.push({ role, index: index.i, unbound: 'theme-unbound', ...extra });
      const p = property(name, b);
      roles.push({ role, index: index.i, concept: concept(name), ...(p ? { bound: { on: p.on, parameter: p.parameter } } : { unbound: 'no-declared-property' }), ...extra });
    };
    for (const [i, a] of (clause.attributes || []).entries()) {
      tick();
      if (a.phase === 'selector') { roles.push({ role: 'attribute', index: i, concept: concept(a.concept), bound: { selector: true } }); continue; }
      bindProperty('attribute', { i, theme: a.theme }, a.concept, a.value_span ? { span: a.value_span } : {});
    }
    for (const [i, s] of (clause.spatial || []).entries()) {
      const b = theme(s.theme);
      const placed = b && b.on.some((on) => (table.relations || []).includes(on));
      if (s.relation) {
        const landmark = resolved[s.landmark];
        roles.push({ role: 'spatial', index: i, relation: s.relation, concept: concept('relation'), ...(!placed ? { unbound: 'no-placement-method' } : !landmark?.on.length ? { unbound: landmark?.reason || 'landmark-not-declared' } : { bound: { placement: true, landmark: landmark.kind } }) });
      }
      if (s.region) roles.push({ role: 'region', index: i, region: s.region, concept: concept('region'), ...(placed ? { bound: { placement: true } } : (() => { const p = b && b.operations.length && property('region', b); return p ? { bound: { on: p.on, parameter: p.parameter } } : { unbound: 'no-placement-method' }; })()) });
      if (s.distance) roles.push({ role: 'distance', index: i, ...(placed ? { bound: { placement: true } } : { unbound: 'no-placement-method' }) });
    }
    for (const [i, m] of (clause.motion || []).entries()) {
      const b = theme(m.theme);
      const p = b && b.operations.length && property('position', b);
      roles.push({ role: 'motion', index: i, direction: m.direction, ...(p ? { bound: { on: p.on, parameter: p.parameter } } : { unbound: 'no-declared-property' }) });
    }
    for (const [i, g] of (clause.goal || []).entries()) {
      if (g.concept) bindProperty('goal', { i, theme: g.theme }, g.concept);
      else roles.push({ role: 'goal', index: i, unbound: 'goal-state-needs-concept' });
    }
    for (const [i, t] of (clause.time || []).entries()) bindProperty('time', { i, theme: t.theme }, 'time.' + (t.role || 'start'));
    for (const [i, m] of (clause.manner || []).entries()) {
      const b = theme(m.theme);
      const p = b && b.operations.length && property('manner', b);
      roles.push({ role: 'manner', index: i, objective: m.objective, ...(p ? { bound: { on: p.on, parameter: p.parameter } } : { unbound: 'no-declared-objective' }) });
    }
    if (clause.question) {
      const b = theme(clause.question.theme ?? themes[0]?.i);
      roles.push({ role: 'question', type: clause.question.type, ...(b?.on.length || resolved[themes[0]?.i]?.on.length ? { bound: { query: true } } : { unbound: 'theme-unbound' }) });
    }
    return { clause: c, themes: [...bindings.values()], resolved, roles };
  });
  const unbound = clauses.flatMap((c) => c.roles.filter((r) => r.unbound).map((r) => ({ clause: c.clause, ...r })));
  const bound = clauses.flatMap((c) => c.roles.filter((r) => r.bound).map((r) => ({ clause: c.clause, ...r })));
  return { clauses, bound, unbound, complete: unbound.length === 0 };
}

const isNew = (m) => (m.reference ?? (m.determiner === 'indefinite' ? 'new' : 'description')) === 'new';

function resolveMention(table, frame, c, m, i, tick) {
  if (m.reference === 'anaphora' && m.antecedent) {
    const prior = frame.clauses[m.antecedent.clause]?.mentions?.[m.antecedent.mention];
    if (prior) return resolveMention(table, frame, m.antecedent.clause, { ...prior, reference: 'description' }, m.antecedent.mention, tick);
  }
  // an observed object's kind is its native kind word; the declared kind label of its source type names its canonical kind
  const objects = (table.objects || []).map((o) => ({ ...o, kind: (table.kinds || []).find((k) => k.on === o.on && (lower(k.label) === lower(o.kind) || k.canonical === o.kind))?.canonical ?? o.kind }));
  if (m.kind) {
    const on = [...new Set([...(table.kinds || []).filter((k) => k.canonical === m.kind).map((k) => k.on), ...objects.filter((o) => o.kind === m.kind).map((o) => o.on)])];
    return { kind: m.kind, on };
  }
  if (!isNew(m)) {
    // an existing referent: its code, its name, or an observed object of its kind word
    const code = m.code && objects.filter((o) => o.id === m.code);
    if (code?.length) return { kind: code[0].kind, on: [code[0].on], object: code[0].id };
    const named = m.name && objects.filter((o) => lower(o.name) === lower(m.name));
    if (named?.length) return { kind: named[0].kind, on: [...new Set(named.map((o) => o.on))] };
    if (m.reference === 'anaphora' || m.reference === 'context') {
      const last = objects.at(-1);
      return last ? { kind: last.kind, on: [last.on], object: last.id } : { kind: undefined, on: [], reason: 'no-antecedent' };
    }
  }
  const head = lower(m.head);
  const rows = (table.kinds || []).filter((k) => { tick(); return lower(k.label) === head; });
  const canon = [...new Set(rows.map((k) => k.canonical))];
  if (canon.length === 1) return { kind: canon[0], on: [...new Set(rows.map((k) => k.on))] };
  if (canon.length > 1) return { kind: canon[0], on: [...new Set(rows.map((k) => k.on))], ambiguous: canon };
  if (!isNew(m) || m.reference === 'population') {
    const seen = objects.filter((o) => lower(o.kind) === head || lower(o.name) === head);
    if (seen.length) return { kind: seen[0].kind, on: [...new Set(seen.map((o) => o.on))] };
    if (m.reference === 'population' && !head) return { kind: undefined, on: [...new Set(objects.map((o) => o.on))] };
  }
  return { kind: undefined, on: [], reason: 'kind-not-declared' };
}

/**
 * Compile a frame to std.request graphs, one per (clause, theme), as a request batch input
 * ({entries:[{id,request,wires,after}]}, see prepareRequestBatch). With `binding` (from bindFrame) only bound roles
 * are written and every unbound role is listed in `disclosed`; without it every role is written. `extended:false`
 * writes only the slots of the std.request contract before 0.237.0 (the frame roles that have no older slot are
 * then disclosed instead of written).
 */
export function frameToRequests(frame, { binding, extended = true, prefix = 'f' } = {}) {
  const issues = inspectFrame(frame).issues;
  if (issues.length) return { ok: false, entries: [], disclosed: [], issues };
  const entries = [], disclosed = [], notes = [];
  const lastEntry = new Map();
  const relations = frame.structure?.relations || [];
  const isUnbound = (c, test) => binding?.clauses[c]?.roles.find((r) => test(r) && r.unbound);
  const roleOf = (c, test) => binding?.clauses[c]?.roles.find(test);
  frame.clauses.forEach((clause, c) => {
    const action = clause.action || {};
    const mentions = clause.mentions || [];
    const resolved = binding?.clauses[c]?.resolved;
    const themes = mentions.map((m, i) => [m, i]).filter(([m]) => (m.role || 'theme') === 'theme');
    if (!themes.length) {
      if (clause.discourse || action.act === 'converse' || action.act === 'undo' || action.act === 'redo') disclosed.push({ clause: c, role: 'clause', reason: clause.discourse ? 'discourse-only' : 'no-theme', ...(clause.span ? { span: clause.span } : {}) });
      else disclosed.push({ clause: c, role: 'clause', reason: 'no-theme', ...(clause.span ? { span: clause.span } : {}) });
      return;
    }
    const after = relations.filter((r) => r.to === c && r.type === 'sequence').map((r) => lastEntry.get(r.from)).filter(Boolean);
    if (!relations.length && c > 0 && lastEntry.get(c - 1)) after.push(lastEntry.get(c - 1));
    for (const [m, ti] of themes) {
      const themeRole = roleOf(c, (r) => r.role === 'theme' && r.mention === ti);
      if (binding && themeRole?.unbound) { disclosed.push({ clause: c, role: 'theme', mention: ti, reason: themeRole.unbound, span: m.span ?? m.head }); continue; }
      const id = `${prefix}${c}_${ti}_`;
      const w = [];
      const kindOf = (mm, i) => resolved?.[i]?.kind ?? mm.kind ?? (mm.head ? atomOf(mm.head) : undefined);
      const mode = isNew(m) ? 'new' : 'existing';
      const r = { act: action.act ?? 'make', mood: action.mood ?? 'do' };
      const source = clause.span ?? frame.text;
      w.push(`@${id}s std.request.source text=${quote(source)}`);
      const reqAttrs = [`act=${atomOf(binding?.clauses[c]?.themes.find((t) => t.mention === ti)?.act ?? r.act)}`, `mood=${r.mood}`, `source=$${id}s`];
      if (extended) {
        if (action.predicate) reqAttrs.push(`predicate=${quote(action.predicate)}`);
        if (action.polarity) reqAttrs.push(`polarity=${action.polarity}`);
        if (clause.fragment) reqAttrs.push(`fragment=${clause.fragment}`);
        if (clause.discourse) reqAttrs.push(`discourse=${clause.discourse}`);
        if (clause.question && FRAME_ROLES.question.includes(clause.question.type)) reqAttrs.push(`question=${clause.question.type}`);
      }
      const targetAttrs = (mm, i, role) => {
        const a = [`request=$${id}r`, `mode=${role === 'theme' ? mode : 'existing'}`];
        const kind = kindOf(mm, i);
        if (kind) a.push(`kind=${token(kind)}`);
        if (mm.name) a.push(`name=${quote(mm.name)}`);
        const det = mm.determiner === 'indefinite' || mm.determiner === 'another' ? 'indefinite' : mm.determiner && mm.determiner !== 'none' ? 'definite' : undefined;
        if (det) a.push(`determiner=${det}`);
        if (extended) {
          if (mm.head) a.push(`head=${quote(mm.head)}`);
          if (mm.reference) a.push(`reference=${mm.reference}`);
          if (mm.code) a.push(`code=${quote(mm.code)}`);
          for (const o of [].concat(mm.ordinal || [])) a.push(`ordinal=${quote(String(o))}`);
          if (role !== 'theme' || !binding) {
            if (Number.isInteger(mm.quantity?.number)) a.push(`count=${mm.quantity.number}`);
            if (mm.quantity?.vague) a.push(`quantity=${atomOf(mm.quantity.vague)}`);
          } else if (mm.quantity?.vague) a.push(`quantity=${atomOf(mm.quantity.vague)}`);
          for (const mod of mm.modifiers || []) a.push(`modifier=${quote(mod)}`);
          a.push(`role=${role}`);
        }
        return a;
      };
      const t = targetAttrs(m, ti, 'theme');
      const extras = [], constraints = [], selectors = [];
      if (m.possessor !== undefined) {
        const p = mentions[m.possessor];
        if (extended && !(binding && isUnbound(c, (rr) => rr.role === 'possessor' && rr.mention === ti))) {
          extras.push(`@${id}o std.request.target ${targetAttrs(p, m.possessor, 'possessor').join(' ')}`);
          t.push(`of=$${id}o`);
        } else disclosed.push({ clause: c, role: 'possessor', mention: ti, reason: extended ? isUnbound(c, (rr) => rr.role === 'possessor' && rr.mention === ti).unbound : 'needs-extended-contract', span: p.span ?? p.head });
      }
      for (const mod of m.modifiers || []) if (binding || !extended) disclosed.push({ clause: c, role: 'modifier', mention: ti, reason: 'modifier-needs-attribute-concept', span: mod });
      const con = (k, attrs) => { constraints.push(`@${id}c${k} std.request.constraint request=$${id}r target=$${id}t ${attrs.join(' ')} character=requirement`); return `${id}c${k}`; };
      let k = 0;
      // quantity: a count result the declared count parameter or repeat takes
      const q = roleOf(c, (rr) => rr.role === 'quantity' && rr.mention === ti);
      const count = q?.bound?.count ?? q?.bound?.repeat ?? (binding ? undefined : m.quantity?.number);
      if (count !== undefined && !(m.quantity?.number === 1 && !q?.bound?.count)) con(k++, ['concept=count', 'operator=eq', `value=${count}`, 'polarity=positive']);
      if (q?.bound?.vague) notes.push({ clause: c, mention: ti, note: `amount ${q.bound.vague} read as ${count}` });
      if (q?.unbound) disclosed.push({ clause: c, role: 'quantity', mention: ti, reason: q.unbound, span: m.quantity?.vague ?? String(m.quantity?.number ?? '') });
      const mine = (x) => (x.theme ?? themes[0][1]) === ti;
      for (const [i, a] of (clause.attributes || []).entries()) {
        if (!mine(a)) continue;
        const rb = roleOf(c, (rr) => rr.role === 'attribute' && rr.index === i);
        if (binding && rb?.unbound) { disclosed.push({ clause: c, role: 'attribute', index: i, concept: a.concept, reason: rb.unbound, span: a.value_span ?? String(a.value ?? '') }); continue; }
        const op = a.operator ?? 'eq';
        const attrs = [`concept=${token(rb?.concept ?? a.concept)}`, `operator=${op === 'region' ? 'region' : op}`, `polarity=${a.polarity ?? 'positive'}`];
        if (op === 'delta') attrs.push(`value=${numberLike(a.value) ? a.value : stepValue(a.step)}`);
        else if (op === 'degree' || op === 'region') attrs.push(`value=${atomOf(a.value ?? a.value_span)}`);
        else if (a.value !== undefined || a.value_span !== undefined) attrs.push(`value=${token(a.value ?? a.value_span)}`);
        if (a.unit && (op === 'eq' || op === 'delta')) attrs.push(`unit=${atomOf(a.unit)}`);
        if (extended && a.step) attrs.push(`step=${a.step}`);
        if (extended && a.value_type) attrs.push(`valueType=${atomOf(a.value_type)}`);
        if (a.phase === 'selector' && mode === 'existing' && op !== 'delta') selectors.push(con(k++, attrs));
        else con(k++, attrs);
      }
      for (const [i, s] of (clause.spatial || []).entries()) {
        if (!mine(s)) continue;
        if (s.relation) {
          const rb = roleOf(c, (rr) => rr.role === 'spatial' && rr.index === i);
          if (binding && rb?.unbound) disclosed.push({ clause: c, role: 'spatial', index: i, reason: rb.unbound, span: s.span ?? s.relation });
          else {
            const lm = mentions[s.landmark];
            const lid = `${id}l${i}`;
            extras.push(`@${lid} std.request.target ${targetAttrs(lm, s.landmark, 'landmark').join(' ')}`);
            const attrs = [`concept=${token(rb?.concept ?? s.concept ?? 'relation')}`, 'operator=relation', `relation=${atomOf(s.relation)}`, `goal=$${lid}`, 'polarity=positive'];
            if (extended) attrs.push(`landmark=$${lid}`);
            if (s.distance && Number.isFinite(Number(s.distance.value)) && s.distance.unit && s.distance.from && s.distance.to) attrs.push(`measure=${Number(s.distance.value)}`, `unit=${atomOf(s.distance.unit)}`, `from=${atomOf(s.distance.from)}`, `to=${atomOf(s.distance.to)}`);
            else if (s.distance) disclosed.push({ clause: c, role: 'distance', index: i, reason: 'distance-needs-frames', span: s.distance.span ?? String(s.distance.value) });
            if (extended && s.side) attrs.push(`side=${atomOf(s.side)}`);
            con(k++, attrs);
          }
        }
        if (s.region) {
          const rb = roleOf(c, (rr) => rr.role === 'region' && rr.index === i);
          if (binding && rb?.unbound) disclosed.push({ clause: c, role: 'region', index: i, reason: rb.unbound, span: s.region });
          else con(k++, [`concept=${token(rb?.concept ?? 'region')}`, 'operator=region', `value=${atomOf(s.region)}`, 'polarity=positive', ...(extended ? [`region=${atomOf(s.region)}`] : [])]);
        }
      }
      for (const [i, mo] of (clause.motion || []).entries()) {
        if (!mine(mo)) continue;
        const rb = roleOf(c, (rr) => rr.role === 'motion' && rr.index === i);
        if (binding && rb?.unbound || !extended) { disclosed.push({ clause: c, role: 'motion', index: i, reason: rb?.unbound ?? 'needs-extended-contract', span: mo.span ?? mo.direction }); continue; }
        const amount = mo.amount?.number ?? stepValue(mo.amount?.degree);
        con(k++, ['concept=position', 'operator=delta', `value=${amount}`, ...(mo.amount?.unit ? [`unit=${atomOf(mo.amount.unit)}`] : []), `direction=${atomOf(mo.direction ?? 'forward')}`, 'polarity=positive']);
      }
      for (const [i, g] of (clause.goal || []).entries()) {
        if (!mine(g)) continue;
        const rb = roleOf(c, (rr) => rr.role === 'goal' && rr.index === i);
        if (binding && rb?.unbound || !g.concept) { disclosed.push({ clause: c, role: 'goal', index: i, reason: rb?.unbound ?? 'goal-state-needs-concept', span: g.span ?? String(g.value ?? '') }); continue; }
        con(k++, [`concept=${token(rb?.concept ?? g.concept)}`, 'operator=eq', `value=${token(g.value ?? g.span)}`, 'polarity=positive']);
      }
      for (const [i, tm] of (clause.time || []).entries()) {
        if (!mine(tm)) continue;
        const rb = roleOf(c, (rr) => rr.role === 'time' && rr.index === i);
        if (binding && rb?.unbound) { disclosed.push({ clause: c, role: 'time', index: i, reason: rb.unbound, span: tm.span ?? String(tm.value ?? '') }); continue; }
        con(k++, [`concept=${token(rb?.concept ?? 'time.' + (tm.role || 'start'))}`, 'operator=eq', `value=${token(tm.value ?? tm.span)}`, 'polarity=positive']);
      }
      for (const [i, mn] of (clause.manner || []).entries()) {
        if (!mine(mn)) continue;
        const rb = roleOf(c, (rr) => rr.role === 'manner' && rr.index === i);
        if (extended && !(binding && rb?.unbound)) { reqAttrs.push(`manner=${atomOf(mn.objective)}`); if (mn.degree) reqAttrs.push(`degree=${mn.degree}`); }
        if (!extended || binding && rb?.unbound) disclosed.push({ clause: c, role: 'manner', index: i, reason: rb?.unbound ?? 'needs-extended-contract', span: mn.span ?? mn.objective });
      }
      let query;
      if (clause.question && (action.mood === 'ask' || r.mood === 'ask') && mode === 'existing') {
        const op = { count: 'count', exists: 'exists', list: 'members', which: 'members' }[clause.question.type] ?? (clause.question.concept ? 'values' : 'members');
        query = `@${id}q std.request.query request=$${id}r target=$${id}t operation=${op}${op === 'values' ? ` concept=${token(clause.question.concept)}` : ''}`;
        reqAttrs.push(`query=$${id}q`);
      }
      if (selectors.length === 1) t.push(`selector=$${selectors[0]}`);
      else if (selectors.length > 1) {
        extras.push(`@${id}g std.request.group request=$${id}r operator=and ${selectors.map((s) => `member=$${s}`).join(' ')}`);
        t.push(`selector=$${id}g`);
      }
      w.push(`@${id}r std.request ${reqAttrs.join(' ')}`);
      w.push(`@${id}t std.request.target ${t.join(' ')}`);
      w.push(...extras, ...constraints);
      if (query) w.push(query);
      const entry = { id: `${prefix}${c}.${ti}`, request: `${id}r`, wires: w.join('\n'), after: [...new Set(after)] };
      entries.push(entry);
      lastEntry.set(c, entry.id);
    }
  });
  return { ok: true, entries, disclosed, notes, issues: [] };
}

const stepValue = (step) => ({ much_more: 2, more: 1, less: -1, much_less: -2, bit: 1, much: 2 })[step] ?? 1;
