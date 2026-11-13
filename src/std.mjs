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
};
