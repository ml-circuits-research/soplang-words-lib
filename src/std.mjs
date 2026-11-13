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
};
