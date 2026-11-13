// The standard function pack (Round 17): pure functions declared in SOP Lang, shipped with
// the library and opt-in: a matrix that says `core.use world=std.numbers` (or std.order,
// std.boxes) gets the declarations and the functions. Nothing here repeats what the
// built-ins (min, max, add, abs, round, clamp, between, sign, lt, ...), the aggregates
// (count, sum, min, max, argmin, argmax, collect) or core.rank already do.

const num = (v) => Number(v);
const out = (x) => (Number.isFinite(x) ? String(+x.toFixed(10)) : undefined);
/** n optional number arguments after `required` ones: declarations a, b, c, ... */
const many = (fn, names, required) => names.map((n, i) => `@${fn}.${n} core.function.arg of=$${fn} name=${n} kind=number${i >= required ? ' optional=true' : ''}`).join('\n');
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const values = (xs) => xs.filter((v) => v !== undefined && v !== '').map(num);


// ---- std.acts: the generic acts over a schema (Round 20) ----------------------------------
const art = (word) => (/^[aeiou]/i.test(String(word)) && !/^(uni|use|eu|one|once)/i.test(String(word)) ? `an ${word}` : `a ${word}`);
const one = (x) => (Array.isArray(x) ? x[0] : x);
const ref = (id) => '$' + String(id).replace(/^\$/, '');
const RESERVED = new Set(['kind', 'world']);
/** The kinds the world's schemas declare: [{ type, world, acts, open }] for a kind name. */
function kindsOf(w, kind) {
  const out = [];
  for (const k of w.ofType('std.schema.kind')) if (k.attrs.of?.[0] === kind) out.push({ type: kind, world: k.attrs.world[0], acts: k.attrs.acts || [] });
  if (!out.length) for (const k of w.ofType('std.schema.kinds')) { // any kind a knowledge type names
    const from = k.attrs.from[0], key = k.attrs.key?.[0] || 'name';
    if (w.ofType(from).some((x) => x.attrs[key]?.includes(kind))) out.push({ type: 'std.schema.thing', world: k.attrs.world[0], acts: k.attrs.acts || [], open: true });
  }
  return out;
}
/** Every act any schema allows, by world, for a kind name: [{ world, acts }]. */
const worldsFor = (w, kind) => kindsOf(w, kind).map((k) => ({ world: k.world, acts: k.acts }));
/** The attributes a kind has: its slots, less kind and world. */
function attrsOf(w, type) {
  const slots = w._compiled().slots.get(type);
  return slots ? [...slots.values()].filter((s) => !RESERVED.has(s.key) && !s.prefix).map((s) => s.key) : [];
}
const slotOf = (w, type, key) => w._compiled().slots.get(type)?.get(key);
/** Refuse with what the kind allows and which worlds allow the act. */
function refuse(w, act, kind, why, extra = {}) {
  const here = kindsOf(w, kind)[0];
  const elsewhere = [...new Set(w.ofType('std.schema.kind').filter((k) => (k.attrs.acts || []).includes(act)).map((k) => k.attrs.world[0]))];
  return { ok: false, why, reason: { act, kind, allowed: here ? here.acts : [], ...(here ? { attrs: attrsOf(w, here.type) } : {}), elsewhere, ...extra } };
}
/** The thing an argument names: an id, or a kind with one thing (or the nth). */
function thingOf(w, arg, nth) {
  const id = String(one(arg)).replace(/^\$/, '');
  const byId = w.get(id);
  if (byId && byId.attrs.kind) return { thing: byId };
  const all = w.ofType('std.schema.thing').filter((t) => t.attrs.kind?.[0] === id);
  if (nth !== undefined) { const n = Number(nth); const t = n < 0 ? all[all.length + n] : all[n - 1]; return t ? { thing: t } : { why: `there is no ${nth}. ${id}`, kind: id }; }
  if (all.length === 1) return { thing: all[0] };
  if (!all.length) return { why: `there is no ${id}`, kind: id };
  return { why: `which ${id}? there are ${all.length}`, kind: id, which: all.map((t) => t.id) };
}
const allows = (w, t, act) => kindsOf(w, t.attrs.kind[0]).some((k) => k.acts.includes(act));
const wireText = (id, type, attrs) => `@${id} ${type}` + Object.entries(attrs).flatMap(([k, vs]) => [].concat(vs).map((v) => ` ${k}=${/^[\w.$:+\-#]+$/.test(String(v)) ? v : JSON.stringify(String(v))}`)).join('');
const fresh = (w, kind) => { const base = kind.replace(/\W/g, '_'); let n = 1; while (w.has(base + n)) n++; return base + n; }; // bounded: the wires of the world
const pre = (act, ctx, args, body) => { const w = ctx.world; return body(w); };

const ACTIONS = {
  acts_make: (ctx, args) => pre('make', ctx, args, (w) => {
    const kind = String(one(args.kind));
    const ks = kindsOf(w, kind).filter((k) => args.world === undefined || k.world === one(args.world));
    if (!ks.length) return refuse(w, 'make', kind, `no world here has ${art(kind)}`);
    const k = ks.find((x) => x.acts.includes('make'));
    if (!k) return refuse(w, 'make', kind, `${art(kind)} cannot be made here`);
    const attrs = { kind, world: k.world };
    for (const s of attrsOf(w, k.type)) { const sl = slotOf(w, k.type, s); if (sl.default !== undefined) attrs[s] = String(sl.default).replace(/^"|"$/g, ''); }
    for (const [key, v] of Object.entries(args)) {
      if (RESERVED.has(key) || key === 'id') continue;
      if (!k.open && !attrsOf(w, k.type).includes(key)) return refuse(w, 'make', kind, `${art(kind)} has no ${key}`, { attr: key });
      attrs[key] = v;
    }
    const id = args.id ? String(args.id) : fresh(w, kind);
    const r = ctx.tell(wireText(id, k.type, attrs), { now: true });
    return r.ok === false ? r : { act: 'make', thing: id };
  }),
  acts_remove: (ctx, args) => pre('remove', ctx, args, (w) => {
    const { thing: t, why, kind, which } = thingOf(w, args.thing, args.nth);
    if (!t) return refuse(w, 'remove', kind, why, which ? { which } : {});
    if (!allows(w, t, 'remove')) return refuse(w, 'remove', t.attrs.kind[0], `${art(t.attrs.kind[0])} cannot be removed here`);
    for (const l of w.ofType('std.acts.link')) if (l.attrs.a[0] === ref(t.id) || l.attrs.b[0] === ref(t.id)) ctx.retract(l.id); // its links go with it
    ctx.retract(t.id);
    return { act: 'remove', thing: t.id };
  }),
  acts_change: (ctx, args) => pre('change', ctx, args, (w) => {
    const { thing: t, why, kind, which } = thingOf(w, args.thing, args.nth);
    if (!t) return refuse(w, 'change', kind, why, which ? { which } : {});
    const k = t.attrs.kind[0], attr = String(one(args.attr));
    if (!allows(w, t, 'change')) return refuse(w, 'change', k, `${art(k)} cannot be changed here`);
    const open = t.type === 'std.schema.thing';
    if (!open && !attrsOf(w, t.type).includes(attr)) {
      const others = [...new Set(w.ofType('std.schema.kind').filter((x) => x.attrs.of[0] !== k && attrsOf(w, x.attrs.of[0]).includes(attr)).map((x) => `${x.attrs.world[0]}:${x.attrs.of[0]}`))];
      return refuse(w, 'change', k, `${art(k)} has no ${attr}`, { attr, hasIt: others });
    }
    let value = args.value === undefined ? undefined : String(one(args.value));
    if (args.by !== undefined) { // more / less: a number moved by an amount (the slot's step, else 1)
      const now = Number(t.attrs[attr]?.[0]), sl = slotOf(w, t.type, attr), step = args.amount !== undefined ? Number(args.amount) : Number(sl?.step?.n ?? 1);
      if (!Number.isFinite(now)) return refuse(w, 'change', k, `the ${attr} of ${t.id} is not a number`, { attr });
      value = String(+(now + (one(args.by) === 'less' ? -step : step)).toFixed(10));
    }
    if (value === undefined) return refuse(w, 'change', k, `to what? (${attr})`, { attr, missing: 'value' });
    const r = w.applyPatch({ sets: [{ id: t.id, key: attr, value }] }); // a set: one undo step, logged with the act's name
    return r.ok === false ? r : { act: 'change', thing: t.id, attr, value };
  }),
  acts_place: (ctx, args) => ACTIONS.acts_change(ctx, { ...args, attr: args.rel ? 'at' : 'x', value: args.rel ? `${one(args.rel)}:${String(one(args.ref)).replace(/^\$/, '')}` : args.x }),
  acts_connect: (ctx, args) => pre('connect', ctx, args, (w) => {
    const a = thingOf(w, args.a), b = thingOf(w, args.b);
    for (const x of [a, b]) {
      if (!x.thing) return refuse(w, 'connect', x.kind, x.why, x.which ? { which: x.which } : {});
      if (!allows(w, x.thing, 'connect')) return refuse(w, 'connect', x.thing.attrs.kind[0], `${art(x.thing.attrs.kind[0])} cannot be connected here`);
    }
    const id = fresh(w, 'link');
    ctx.tell(wireText(id, 'std.acts.link', { a: ref(a.thing.id), b: ref(b.thing.id), ...(args.rel ? { rel: one(args.rel) } : {}) }), { now: true });
    return { act: 'connect', link: id };
  }),
  acts_group: (ctx, args) => pre('group', ctx, args, (w) => {
    const ids = [];
    for (const x of [].concat(args.things)) {
      const r = thingOf(w, x);
      if (!r.thing) return refuse(w, 'group', r.kind, r.why, r.which ? { which: r.which } : {});
      if (!allows(w, r.thing, 'group')) return refuse(w, 'group', r.thing.attrs.kind[0], `${art(r.thing.attrs.kind[0])} cannot be grouped here`);
      ids.push(ref(r.thing.id));
    }
    const name = args.name ? String(one(args.name)) : fresh(w, 'group');
    ctx.tell(wireText(name, 'std.acts.group', { name, member: ids }), { now: true });
    return { act: 'group', group: name };
  }),
  acts_ungroup: (ctx, args) => { const g = ctx.world.get(String(one(args.group))); if (!g || g.type !== 'std.acts.group') return { ok: false, why: `there is no group ${one(args.group)}` }; ctx.retract(g.id); return { act: 'ungroup', group: g.id }; },
  acts_pick: (ctx, args) => pre('pick', ctx, args, (w) => {
    const kind = String(one(args.kind));
    let all = w.ofType('std.schema.thing').filter((t) => t.attrs.kind?.[0] === kind);
    for (const [key, v] of Object.entries(args)) if (!['kind', 'nth'].includes(key)) all = all.filter((t) => t.attrs[key]?.includes(String(one(v))));
    if (args.nth !== undefined) { const n = Number(one(args.nth)); all = [n < 0 ? all[all.length + n] : all[n - 1]].filter(Boolean); }
    return { act: 'pick', things: all.map((t) => t.id) };
  }),
  acts_ask: (ctx, args) => pre('ask', ctx, args, (w) => {
    const { thing: t, why, kind, which } = thingOf(w, args.thing, args.nth);
    if (!t) return refuse(w, 'ask', kind, why, which ? { which } : {});
    if (args.attr === undefined) return { act: 'ask', thing: t.id, attrs: Object.fromEntries(Object.entries(t.attrs).map(([k, v]) => [k, v.length === 1 ? v[0] : [...v]])) };
    const attr = String(one(args.attr));
    return { act: 'ask', thing: t.id, attr, value: t.attrs[attr]?.[0] ?? null, why: w.why(t.id, attr) };
  }),
  acts_copy: (ctx, args) => pre('copy', ctx, args, (w) => {
    const { thing: t, why, kind, which } = thingOf(w, args.thing, args.nth);
    if (!t) return refuse(w, 'copy', kind, why, which ? { which } : {});
    if (!allows(w, t, 'copy')) return refuse(w, 'copy', t.attrs.kind[0], `${art(t.attrs.kind[0])} cannot be copied here`);
    const id = fresh(w, t.attrs.kind[0]);
    ctx.tell(wireText(id, t.type, t.attrs), { now: true });
    return { act: 'copy', thing: id, from: t.id };
  }),
};

export const STD = {
  'std.numbers': {
    text: `
@average core.function name=average out.kind=number pure=true doc="the mean of two to eight numbers"
${many('average', LETTERS, 2)}
@median core.function name=median out.kind=number pure=true doc="the middle of one to eight numbers (the mean of the two middle ones for an even count)"
${many('median', LETTERS, 1)}
`,
    fns: {
      average: (xs) => { const v = values(xs); return out(v.reduce((a, b) => a + b, 0) / v.length); },
      median: (xs) => { const v = values(xs).sort((a, b) => a - b); const m = v.length >> 1; return out(v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2); },
    },
  },
  'std.order': {
    text: `
@rank_in core.function name=rank_in out.kind=integer pure=true doc="the place of a value among the others, 1 for the smallest"
@rank_in.value core.function.arg of=$rank_in name=value kind=number
${many('rank_in', LETTERS, 1)}
@nth_smallest core.function name=nth_smallest out.kind=number pure=true doc="the n-th smallest of the numbers, 1 for the smallest"
@nth_smallest.n core.function.arg of=$nth_smallest name=n kind=integer
${many('nth_smallest', LETTERS, 1)}
@nth_largest core.function name=nth_largest out.kind=number pure=true doc="the n-th largest of the numbers, 1 for the largest"
@nth_largest.n core.function.arg of=$nth_largest name=n kind=integer
${many('nth_largest', LETTERS, 1)}
`,
    fns: {
      rank_in: ([v, ...xs]) => String(values(xs).filter((x) => x < num(v)).length + 1),
      nth_smallest: ([n, ...xs]) => out(values(xs).sort((a, b) => a - b)[num(n) - 1]),
      nth_largest: ([n, ...xs]) => out(values(xs).sort((a, b) => b - a)[num(n) - 1]),
    },
  },
  'std.boxes': {
    // a box is x, y (its top left corner), w, h; y grows downwards, as on a screen
    text: `
@centre_x core.function name=centre_x out.kind=number pure=true doc="the middle of a box across: x + w / 2"
@centre_x.x core.function.arg of=$centre_x name=x kind=number
@centre_x.w core.function.arg of=$centre_x name=w kind=number
@centre_y core.function name=centre_y out.kind=number pure=true doc="the middle of a box down: y + h / 2"
@centre_y.y core.function.arg of=$centre_y name=y kind=number
@centre_y.h core.function.arg of=$centre_y name=h kind=number
@overlaps core.function name=overlaps out.kind=boolean pure=true doc="whether two boxes share some area"
@contains_box core.function name=contains_box out.kind=boolean pure=true doc="whether the first box holds the whole of the second"
@box_distance core.function name=box_distance out.kind=number pure=true doc="the distance between the centres of two boxes"
${['overlaps', 'contains_box', 'box_distance'].map((f) => ['x1', 'y1', 'w1', 'h1', 'x2', 'y2', 'w2', 'h2'].map((n) => `@${f}.${n} core.function.arg of=$${f} name=${n} kind=number`).join('\n')).join('\n')}
`,
    fns: {
      centre_x: ([x, w]) => out(num(x) + num(w) / 2),
      centre_y: ([y, h]) => out(num(y) + num(h) / 2),
      overlaps: (a) => { const [x1, y1, w1, h1, x2, y2, w2, h2] = a.map(num); return x1 < x2 + w2 && x2 < x1 + w1 && y1 < y2 + h2 && y2 < y1 + h1; },
      contains_box: (a) => { const [x1, y1, w1, h1, x2, y2, w2, h2] = a.map(num); return x2 >= x1 && y2 >= y1 && x2 + w2 <= x1 + w1 && y2 + h2 <= y1 + h1; },
      box_distance: (a) => { const [x1, y1, w1, h1, x2, y2, w2, h2] = a.map(num); return out(Math.hypot(x1 + w1 / 2 - (x2 + w2 / 2), y1 + h1 / 2 - (y2 + h2 / 2))); },
    },
  },
  // Round 19 (Q25 → a): choosing a value for a key a request left out, from offers of other
  // modules, by named tiers declared once. Rules, aggregates and a soft deny;
  // no function. A host writes `std.fill.need for=<request> key=<key>` when its request lacks a
  // key, its modules write `std.fill.offer for=<need> value= tier= source=`, and std.fill writes
  // the choice onto the need: `value= tier= source=`. Two offers of the best tier: a soft deny
  // (advice), nothing chosen. A tier a host adds is one more `std.fill.tier name= rank=` wire.
  'std.fill': {
    text: String.raw`
@k.need.for core.slot of=std.fill.need key=for id=true
@k.need.key core.slot of=std.fill.need key=key id=true
@k.need.value core.slot of=std.fill.need key=value
@k.need.tier core.slot of=std.fill.need key=tier
@k.need.source core.slot of=std.fill.need key=source
@k.offer.for core.slot of=std.fill.offer key=for required=true
@k.offer.value core.slot of=std.fill.offer key=value required=true
@k.offer.tier core.slot of=std.fill.offer key=tier required=true
@k.offer.source core.slot of=std.fill.offer key=source
@k.offer.rank core.slot of=std.fill.offer key=rank kind=integer
@k.tier.name core.slot of=std.fill.tier key=name id=true
@k.tier.rank core.slot of=std.fill.tier key=rank kind=integer required=true
@k.best.need core.slot of=std.fill.best key=need id=true
@k.at.need core.slot of=std.fill.at_rank key=need id=true
@k.at.rank core.slot of=std.fill.at_rank key=rank id=true

# the tiers, best first: what the user said, the dialogue focus, the scene, knowledge, a default
@user std.fill.tier name=user rank=1
@focus std.fill.tier name=focus rank=2
@scene std.fill.tier name=scene rank=3
@knowledge std.fill.tier name=knowledge rank=4
@default std.fill.tier name=default rank=5

# an offer takes the rank of its tier
@o std.fill.offer tier=?t
@tr std.fill.tier name=?t rank=?r
@or std.fill.offer core.on=$o rank=?r
@ranked core.rule when=$o when=$tr then=$or

# the best rank offered for each need, and how many offers each rank has (equal ranks are a tie)
@ro std.fill.offer for=?n rank=?r
@low core.aggregate over=$ro by=?n min=?m args=?r then=$bs
@bs std.fill.best need=?n rank=?m
@cnt core.aggregate over=$ro by=?n by=?r count=?c then=$at
@at std.fill.at_rank need=?n rank=?r n=?c

# the choice: the offer of the best rank, when it is alone at that rank
@nd std.fill.need for=?req key=?k
@top std.fill.best need=$nd rank=?m
@alone std.fill.at_rank need=$nd rank=?m n=1
@first std.fill.offer for=$nd rank=?m value=?v tier=?t source=?s
@put std.fill.need core.on=$nd value=?v tier=?t source=?s
@choose core.rule when=$nd when=$top when=$alone when=$first then=$put

# more than one offer at the best rank: advice, nothing chosen
@nd2 std.fill.need for=?req key=?k
@top2 std.fill.best need=$nd2 rank=?m
@two std.fill.at_rank need=$nd2 rank=?m n=?c
@more core.check fn=gt args=?c args=1
@tie core.deny when=$nd2 when=$top2 when=$two if=$more soft=true why="?c offers of the best tier for ?k of ?req"
`,
    fns: {},
  },
  // Round 19: the dialogue focus. A host's rules write `std.focus.mention of=<request>
  // kind= value=` for what a request names (a thing, an action, a place, a world). Each
  // request is a turn, in the order of arrival; the focus after a turn is what it mentions
  // and, for the kinds it does not mention, the focus after the turn before. With std.fill,
  // a need of a request for a key gets the focus of that kind after the turn before it, in
  // tier `focus`; what a need is filled with is a mention of its request too, so a dialogue
  // keeps its thing over several turns. `std.focus.last kind=` holds the focus now.
  'std.focus': {
    text: String.raw`
@fill core.use world=std.fill
@k.turn.of core.slot of=std.focus.turn key=of id=true
@k.turn.in core.slot of=std.focus.turn key=in required=true
@k.turn.pos core.slot of=std.focus.turn key=pos kind=integer
@k.turn.prev core.slot of=std.focus.turn key=prev kind=integer
@k.m.of core.slot of=std.focus.mention key=of required=true
@k.m.kind core.slot of=std.focus.mention key=kind required=true
@k.m.value core.slot of=std.focus.mention key=value required=true
@k.st.turn core.slot of=std.focus.state key=turn id=true
@k.st.kind core.slot of=std.focus.state key=kind id=true
@k.last.kind core.slot of=std.focus.last key=kind id=true

# the turns of a dialogue, in arrival order (the host writes one per request: of= in=)
@t std.focus.turn in=?d
@order core.rank of=$t by=in within=?d out=?p
@prev core.calc out=?q fn=add args=?p args=-1
@tp std.focus.turn core.on=$t pos=?p prev=?q
@place core.rule when=$t with=$order with=$prev then=$tp

# the focus after a turn: what it mentions; else what the focus was after the turn before
@sm std.focus.mention of=?r kind=?k value=?v
@st std.focus.turn of=?r
@s1 std.focus.state turn=$st kind=?k value=?v
@said core.rule when=$sm when=$st then=$s1
@ct std.focus.turn of=?r in=?d prev=?q
@cp std.focus.turn in=?d pos=?q
@cs std.focus.state turn=$cp kind=?k value=?v
@cn std.focus.mention of=?r kind=?k
@s2 std.focus.state turn=$ct kind=?k value=?v
@kept core.rule when=$ct when=$cp when=$cs not=$cn then=$s2

# a need of a request: the focus of its kind after the turn before is offered
@n std.fill.need for=?r key=?k
@nt std.focus.turn of=?r in=?d prev=?q
@np std.focus.turn in=?d pos=?q
@ns std.focus.state turn=$np kind=?k value=?v
@o std.fill.offer for=$n value=?v tier=focus source=focus
@offer core.rule when=$n when=$nt when=$np when=$ns then=$o

# the focus now: the last mention of each kind
@f core.fluent of=std.focus.last key=value
@e core.effect on=std.focus.mention fluent=$f op=set amount=value where.kind=kind
@thing std.focus.last kind=thing
@action std.focus.last kind=action
@place.now std.focus.last kind=place
@world std.focus.last kind=world
`,
    fns: {},
  },
  // Round 19: things in a picture and the relations kept between them. A thing is a
  // `std.relations.box kind= w= h=`; its place (x, y: top left, y grows downwards) is
  // either told with `std.relations.at thing= x= y=` or kept by a relation to another
  // thing, `std.relations.keep thing= rel= ref=` with rel one of on, in, next_to, above,
  // in_front_of: when the other thing moves, the place follows. Several things kept the
  // same way on one thing stand in a row, in the order they were kept. Rules and the
  // built-in arithmetic only; sets: `each`, `nth` ("the first"), `spread` (one per place)
  // and the action `relations.put_all`.
  'std.relations': {
    text: String.raw`
@k.kind core.slot of=std.relations.box key=kind
${['x', 'y', 'w', 'h'].map((k) => `@k.${k} core.slot of=std.relations.box key=${k} kind=number`).join('\n')}
@k.at.thing core.slot of=std.relations.at key=thing id=true
@k.keep.thing core.slot of=std.relations.keep key=thing id=true
@k.keep.rel core.slot of=std.relations.keep key=rel enum=on enum=in enum=next_to enum=above enum=in_front_of required=true
@k.keep.ref core.slot of=std.relations.keep key=ref required=true

# a place told
@at.t std.relations.box
@at.a std.relations.at thing=$at.t x=?x y=?y
@at.p std.relations.box core.on=$at.t x=?x y=?y
@told core.rule when=$at.t when=$at.a then=$at.p

# the things kept the same way on one thing, in the order they were kept: 1, 2, ...
# (core.rank orders by a key that every peer has alike, so they stay in the order kept)
@k0 std.relations.keep rel=?l
@k1 std.relations.keep core.on=$k0 kept=yes
@marked core.rule when=$k0 then=$k1
@kp std.relations.keep ref=?r rel=?l kept=?z
@slot core.rank of=$kp by=kept within=?r within=?l out=?i
@ks std.relations.keep core.on=$kp slot=?i
@slotted core.rule when=$kp with=$slot then=$ks

${[
  // rel, x of the first (from the other thing rx ry rw rh and this one's w h), y
  ['on', 'centre', ['sub', '?ry', '?h']],
  ['in', 'centre', null],
  ['above', 'centre', null],
  ['in_front_of', 'centre', null],
  ['next_to', 'after', null],
].map(([rel]) => {
  const p = (n) => `${rel}.${n}`;
  const x0 = rel === 'next_to'
    ? `@${p('a')} core.calc out=?a fn=add args=?rx args=?rw\n@${p('b')} core.calc out=?b fn=add args=?a args=5`
    : `@${p('a')} core.calc out=?a fn=sub args=?rw args=?w\n@${p('a2')} core.calc out=?a2 fn=div args=?a args=2\n@${p('b')} core.calc out=?b fn=add args=?rx args=?a2`;
  const y = {
    on: `@${p('y')} core.calc out=?y fn=sub args=?ry args=?h`,
    above: `@${p('y0')} core.calc out=?y0 fn=sub args=?ry args=?h\n@${p('y')} core.calc out=?y fn=sub args=?y0 args=10`,
    in: `@${p('y0')} core.calc out=?y0 fn=sub args=?rh args=?h\n@${p('y1')} core.calc out=?y1 fn=div args=?y0 args=2\n@${p('y')} core.calc out=?y fn=add args=?ry args=?y1`,
    in_front_of: `@${p('y0')} core.calc out=?y0 fn=add args=?ry args=?rh\n@${p('y1')} core.calc out=?y1 fn=sub args=?y0 args=?h\n@${p('y')} core.calc out=?y fn=add args=?y1 args=5`,
    next_to: `@${p('y0')} core.calc out=?y0 fn=add args=?ry args=?rh\n@${p('y')} core.calc out=?y fn=sub args=?y0 args=?h`,
  }[rel];
  const calcs = [...x0.split('\n'), `@${p('i')} core.calc out=?i1 fn=sub args=?i args=1`, `@${p('s')} core.calc out=?st fn=add args=?w args=5`, `@${p('o')} core.calc out=?off fn=mul args=?i1 args=?st`, `@${p('x')} core.calc out=?x fn=add args=?b args=?off`, ...y.split('\n')];
  return `# ${rel.replace(/_/g, ' ')}
@${p('t')} std.relations.box w=?w h=?h
@${p('r')} std.relations.box x=?rx y=?ry w=?rw h=?rh
@${p('k')} std.relations.keep thing=$${p('t')} rel=${rel} ref=$${p('r')} slot=?i
${calcs.join('\n')}
@${p('p')} std.relations.box core.on=$${p('t')} x=?x y=?y
@${rel} core.rule when=$${p('t')} when=$${p('r')} when=$${p('k')} ${calcs.map((c) => 'with=$' + c.slice(1, c.indexOf(' '))).join(' ')} then=$${p('p')}`;
}).join('\n\n')}

# the order of the things of a kind from the left: 1, 2, ...; "the first cup" is order 1
@ob std.relations.box kind=?k x=?x
@order core.rank of=$ob by=x within=?k out=?n
@oo std.relations.box core.on=$ob order=?n
@ordered core.rule when=$ob with=$order then=$oo
@nq std.relations.nth kind=?k n=?n
@nb std.relations.box kind=?k order=?n
@nr std.relations.nth core.on=$nq item=$nb
@picked core.rule when=$nq when=$nb then=$nr

# each: one new thing of a kind for every thing of another kind, kept to it
@ee std.relations.each kind=?k w=?w h=?h rel=?l over=?o
@er std.relations.box kind=?o
@eb std.relations.box kind=?k w=?w h=?h for=$er
@ek std.relations.keep thing=$eb rel=?l ref=$er
@each core.rule when=$ee when=$er then=$eb then=$ek

# spread: the things of a kind paired one to one, left to right, with the things of another
@ss std.relations.spread kind=?k over=?o
@sa std.relations.box kind=?k order=?n
@sb std.relations.box kind=?o order=?n
@sp std.relations.pair thing=$sa ref=$sb spread=$ss
@paired core.rule when=$ss when=$sa when=$sb then=$sp

# put all the things of a kind (that have a told place) somewhere, kept there
@pa.b std.relations.box kind=?k
@pa.a std.relations.at thing=$pa.b
@pa.k std.relations.keep thing=$pa.b rel=?rel ref=?ref
@put_all core.action name=relations.put_all param=k param=rel param=ref when=$pa.b when=$pa.a remove=$pa.a add=$pa.k all=true
# and each one where spread pairs it
@pp.p std.relations.pair thing=?t ref=?r spread=?s
@pp.a std.relations.at thing=?t
@pp.k std.relations.keep thing=?t rel=?rel ref=?r
@put_pairs core.action name=relations.put_pairs param=s param=rel when=$pp.p when=$pp.a remove=$pp.a add=$pp.k all=true
`,
    fns: {},
  },
  // Round 20 (ACTS × SCHEMAS): a world that does things, declared as data. Its kinds are
  // types that extend std.schema.thing (one pattern sees every thing), their attributes are
  // core.slot (kinds, enums, ranges, defaults), and std.schema.kind says which world a kind
  // belongs to and which acts apply to it; std.schema.kinds lets a world take any kind a
  // knowledge type names. A limit is checked by rules.
  'std.schema': {
    text: String.raw`
@k.thing.kind core.slot of=std.schema.thing key=kind required=true
@k.thing.world core.slot of=std.schema.thing key=world
@k.world.name core.slot of=std.schema.world key=name id=true
@k.kind.of core.slot of=std.schema.kind key=of id=true
@k.kind.world core.slot of=std.schema.kind key=world required=true
@k.kind.acts core.slot of=std.schema.kind key=acts many=true ACTENUM
@k.kinds.world core.slot of=std.schema.kinds key=world id=true
@k.kinds.from core.slot of=std.schema.kinds key=from required=true
@k.kinds.acts core.slot of=std.schema.kinds key=acts many=true ACTENUM
@k.limit.of core.slot of=std.schema.limit key=of id=true
@k.limit.max core.slot of=std.schema.limit key=max kind=integer required=true
@k.count.kind core.slot of=std.schema.count key=kind id=true

# a kind belongs to a declared world
@kw std.schema.kind world=?w
@ww std.schema.world name=?w
@nowhere core.deny when=$kw not=$ww why="no world named ?w is declared"
@ksw std.schema.kinds world=?w
@ksww std.schema.world name=?w
@nowhere2 core.deny when=$ksw not=$ksww why="no world named ?w is declared"

# how many things there are of each kind that has a limit; a limit refuses one more
@lk std.schema.limit of=?k
@lt std.schema.thing kind=?k
@cnt core.aggregate over=$lk over=$lt by=?k count=?n then=$tally
@tally std.schema.count kind=?k n=?n
@lm std.schema.limit of=?k max=?m
@lc std.schema.count kind=?k n=?n
@over core.check fn=gt args=?n args=?m
@toomany core.deny when=$lm when=$lc if=$over why="at most ?m ?k"
`.replace(/ACTENUM/g, 'enum=make enum=remove enum=change enum=place enum=connect enum=group enum=pick enum=ask enum=copy'),
    fns: {},
  },
  // Round 20: the acts, the same for every world declared with std.schema. Each is one
  // generic action: what a world says is data, so a new schema needs no rule. An act that
  // does not apply says what the thing's kind allows and which world allows the act.
  'std.acts': {
    text: String.raw`
@schema core.use world=std.schema
@k.link.a core.slot of=std.acts.link key=a required=true
@k.link.b core.slot of=std.acts.link key=b required=true
@k.group.name core.slot of=std.acts.group key=name id=true
@k.group.member core.slot of=std.acts.group key=member many=true
@make core.action name=make fn=acts_make required=kind
@remove core.action name=remove fn=acts_remove required=thing
@change core.action name=change fn=acts_change required=thing required=attr
@place core.action name=place fn=acts_place required=thing
@connect core.action name=connect fn=acts_connect required=a required=b
@group core.action name=group fn=acts_group required=things
@ungroup core.action name=ungroup fn=acts_ungroup required=group
@pick core.action name=pick fn=acts_pick required=kind
@ask core.action name=ask fn=acts_ask required=thing
@copy core.action name=copy fn=acts_copy required=thing
`,
    fns: {},
    actions: ACTIONS,
  },
};
