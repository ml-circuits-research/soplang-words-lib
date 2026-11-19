// Corpus v2: harder, real-grounded cases. The input contract is unchanged (intent
// packets in, elementary state circuits out) but the WORLD now carries the kind of
// knowledge the library review asks about:
//
//   - `lr.rule`  — rules specific to certain forms, as fact wires in the world
//                  (a real boat goes on water; a real house avoids water).
//   - `lr.grade` — word tables as facts (psys2's ui.avatar.size pattern: "small"
//                  means 0.5 scale) instead of code tables.
//   - `lr.pref`  — session preferences persisted in the world (Ana prefers late
//                  slots): facts that a compiler must read to build its objective.
//   - `dc.operation` / `dc.parameter` — tool capability declarations in SOP
//                  (the std.capability.operation/parameter shapes): the parameters
//                  a tool accepts, their ranges and enums. These, not constants in
//                  code, fix the variables and their domains.
//   - `demo.part` — real composition data from k.objects (the real Not sailboat:
//                  two real parts, real colours, the 0-100 frame).
//
// Case pairs (a/b) share an intent and differ by ONE world fact, so a difference in
// output can only come from the knowledge in the world:
//   w1a/w1b — the same meeting, with and without Ana's persisted "late" preference.
//   w2a/w2b — the same "draw a boat", with and without the on-water rule.
//
// Scale cases s-* are generated deterministically (no randomness) and measure the
// same four compilers at realistic sizes.
export const CASES2 = [];

const RULES = `
@t.lr.rule core.type of=lr.rule closed=true
@s.lr.kind core.slot of=lr.rule key=for present=true
@s.lr.rel core.slot of=lr.rule key=relation enum=in enum=avoid enum=near enum=right enum=left enum=below present=true
@s.lr.anchor core.slot of=lr.rule key=anchor-kind
@s.lr.gap core.slot of=lr.rule key=gap kind=number
@s.lr.strength core.slot of=lr.rule key=strength enum=hard enum=soft
@t.lr.grade core.type of=lr.grade closed=true
@s.g.word core.slot of=lr.grade key=word present=true
@s.g.kind core.slot of=lr.grade key=kind
@s.g.scale core.slot of=lr.grade key=scale kind=number present=true
@t.lr.pref core.type of=lr.pref closed=true
@s.p.person core.slot of=lr.pref key=person present=true
@s.p.value core.slot of=lr.pref key=value present=true
@s.p.strength core.slot of=lr.pref key=strength enum=soft
`;

const CAPABILITIES = `
@t.dc.operation core.type of=dc.operation closed=true
@s.dc.name core.slot of=dc.operation key=name present=true
@s.dc.act core.slot of=dc.operation key=act enum=make enum=change enum=assign enum=inspect present=true
@s.dc.on core.slot of=dc.operation key=on present=true
@t.dc.parameter core.type of=dc.parameter closed=true
@s.dcp.operation core.slot of=dc.parameter key=operation present=true
@s.dcp.pname core.slot of=dc.parameter key=param present=true
@s.dcp.kind core.slot of=dc.parameter key=kind enum=number enum=atom present=true
@s.dcp.min core.slot of=dc.parameter key=min kind=number
@s.dcp.max core.slot of=dc.parameter key=max kind=number
@s.dcp.accepts core.slot of=dc.parameter key=accepts many=true
`;

const DRAW2 = `
@dx core.use world=std.schema
@t.draw.region core.type of=draw.region closed=true
@s.rg.name core.slot of=draw.region key=name present=true
@s.rg.x core.slot of=draw.region key=x kind=number required=true
@s.rg.y core.slot of=draw.region key=y kind=number required=true
@s.rg.w core.slot of=draw.region key=w kind=number required=true
@s.rg.h core.slot of=draw.region key=h kind=number required=true
@page draw.region name=page x=0 y=0 w=800 h=600
@sky draw.region name=sky x=0 y=0 w=800 h=150
@s.d.kind core.slot of=draw.thing key=kind enum=circle enum=rectangle enum=tree enum=house enum=boat enum=sun enum=lake enum=mast enum=sail present=true

@s.d.x core.slot of=draw.thing key=x kind=number min=0 max=800 required=true
@s.d.y core.slot of=draw.thing key=y kind=number min=0 max=600 required=true
@s.d.w core.slot of=draw.thing key=w kind=number min=1 max=800 required=true
@s.d.h core.slot of=draw.thing key=h kind=number min=1 max=600 required=true
@s.d.colour core.slot of=draw.thing key=colour enum=red enum=blue enum=green enum=brown enum=yellow enum=grey present=true
@t.x.set core.type of=x.set closed=true
@s.xs.object core.slot of=x.set key=object present=true
@s.xs.key core.slot of=x.set key=key present=true
@s.xs.value core.slot of=x.set key=value present=true
@t.x.answer core.type of=x.answer closed=true
@s.xa.text core.slot of=x.answer key=text present=true
@t.demo.part core.type of=demo.part closed=true
@s.dp.of core.slot of=demo.part key=of present=true
@s.dp.name core.slot of=demo.part key=name present=true
@s.dp.x core.slot of=demo.part key=x kind=number required=true
@s.dp.y core.slot of=demo.part key=y kind=number required=true
@s.dp.w core.slot of=demo.part key=w kind=number required=true
@s.dp.h core.slot of=demo.part key=h kind=number required=true
@s.dp.colour core.slot of=demo.part key=colour present=true
${RULES}${CAPABILITIES}
@dc.make dc.operation name="demo.make" act=make on=thing
@dcp.x dc.parameter operation=$dc.make param=x kind=number min=0 max=800
@dcp.y dc.parameter operation=$dc.make param=y kind=number min=0 max=600
@dcp.w dc.parameter operation=$dc.make param=w kind=number min=1 max=800
@dcp.h dc.parameter operation=$dc.make param=h kind=number min=1 max=600
@dcp.colour dc.parameter operation=$dc.make param=colour kind=atom accepts=red accepts=blue accepts=green accepts=brown accepts=yellow accepts=grey
`;

const CAL2 = `
@cx core.use world=std.schema
@t.cal.event core.type of=cal.event closed=true
@s.e.title core.slot of=cal.event key=title required=true
@s.e.start core.slot of=cal.event key=start kind=number min=0 max=480 required=true
@s.e.end core.slot of=cal.event key=end kind=number min=0 max=480 required=true
@s.e.person core.slot of=cal.event key=person enum=Ana enum=Dan enum=Bob required=true
${RULES}${CAPABILITIES}
@dc.event dc.operation name="demo.meeting" act=make on=event
@dcp.start dc.parameter operation=$dc.event param=start kind=number min=0 max=480
@dcp.end dc.parameter operation=$dc.event param=end kind=number min=0 max=480
@dcp.person dc.parameter operation=$dc.event param=person kind=atom accepts=Ana accepts=Dan accepts=Bob
@t.x.answer core.type of=x.answer closed=true
@s.xa.text core.slot of=x.answer key=text present=true
`;

const anaBusy = `
@b1 cal.event title="b1" start=90 end=150 person=Ana
@b2 cal.event title="b2" start=210 end=270 person=Ana
@b3 cal.event title="b3" start=330 end=390 person=Ana`;

CASES2.push({
  id: 'w1a', family: 'cal',
  world: CAL2 + anaBusy,
  intent: `
@i1 x.intent act=make note="schedule a 60 minute meeting for Ana"
@i1.t1 x.target intent=$i1 kind=event w=60 mode=new
@i1.o1 x.option intent=$i1 key=person value=Ana`,
  criteria: 'Minutes since 09:00, day 0-480, Ana busy 90-150/210-270/330-390. No preference is declared in this world. Plausible: earliest free 60-minute slot, i.e. 0-60 (09:00-10:00). A later free slot (390+) is not wrong but clearly weaker.',
});
CASES2.push({
  id: 'w1b', family: 'cal',
  world: CAL2 + anaBusy + `
@pref.ana lr.pref person=Ana value=late strength=soft`,
  intent: `
@i2 x.intent act=make note="schedule a 60 minute meeting for Ana"
@i2.t1 x.target intent=$i2 kind=event w=60 mode=new
@i2.o1 x.option intent=$i2 key=person value=Ana`,
  criteria: 'Same Ana day (busy 90-150/210-270/330-390) — but the world now PERSISTS a session preference: Ana prefers late slots (lr.pref person=Ana value=late). Plausible: the meeting lands in the late part of the day (>= 240, ideally 390-450 area), NOT at 0-60. An answer identical to the no-preference case (start 0) fails the persisted preference.',
});

CASES2.push({
  id: 'w2a', family: 'draw',
  world: DRAW2 + `
@lake draw.thing kind=lake x=300 y=250 w=200 h=150 colour=blue`,
  intent: `
@i3 x.intent act=make note="draw a boat"
@i3.t1 x.target intent=$i3 kind=boat w=60 h=30 mode=new`,
  criteria: 'No rule is declared in this world: a boat anywhere on the page is plausible (valid placement, sensible colour); the lake is irrelevant here.',
});
CASES2.push({
  id: 'w2b', family: 'draw',
  world: DRAW2 + `
@lake draw.thing kind=lake x=300 y=250 w=200 h=150 colour=blue
@r.boat lr.rule for=boat relation=in anchor-kind=lake strength=hard
@r.house lr.rule for=house relation=avoid anchor-kind=lake strength=hard`,
  intent: `
@i4 x.intent act=make note="draw a boat"
@i4.t1 x.target intent=$i4 kind=boat w=60 h=30 mode=new`,
  criteria: 'The world now RULES that boats always go inside lake-kind areas and houses avoid them (lr.rule facts). Plausible: the boat is inside the lake (300-500 / 250-400), even though the intent only says "draw a boat". A boat outside the lake violates the world\'s own rule.',
});
CASES2.push({
  id: 'w3', family: 'draw',
  world: DRAW2 + `
@tree draw.thing kind=tree x=100 y=100 w=80 h=80 colour=green
@lake draw.thing kind=lake x=300 y=250 w=200 h=150 colour=blue
@g.small lr.grade word=small kind=house scale=0.5
@r.house lr.rule for=house relation=avoid anchor-kind=lake strength=hard`,
  intent: `
@i5 x.intent act=make note="draw a small house near the tree"
@i5.t1 x.target intent=$i5 kind=house w=200 h=160 mode=new
@i5.o1 x.option intent=$i5 key=size value=small
@i5.r1 x.rel intent=$i5 kind=near target=$i5.t1 anchor=tree gap=40`,
  criteria: 'The world\'s table says "small" halves a house (lr.grade word=small scale=0.5) and houses avoid the lake. The intent asks for a small house near the tree. Plausible: the house is 100x80 (halved), disjoint from the tree with a visible gap of at most ~40, disjoint from the lake, on-page.',
});

CASES2.push({
  id: 'w4', family: 'draw',
  world: DRAW2 + `
@lake draw.thing kind=lake x=300 y=250 w=200 h=150 colour=blue
@part.mast demo.part of=sailboat name=mast x=53 y=4.3 w=5.8 h=83.4 colour=grey
@part.sail demo.part of=sailboat name=sail x=9.2 y=3.1 w=48.7 h=77.5 colour=red`,
  intent: `
@i6 x.intent act=make note="draw the sailboat on the lake"
@i6.t1 x.target intent=$i6 kind=sailboat mode=new
@i6.r1 x.rel intent=$i6 kind=on target=$i6.t1 anchor=lake`,
  criteria: 'The REAL k.objects sailboat: two real parts in a 0-100 frame — a mast (x53 y4.3, 5.8x83.4, grey) and a red sail (x9.2 y3.1, 48.7x77.5). Plausible: BOTH parts are emitted as draw.thing wires (kind=mast/grey, kind=sail or sailboat-sail/red is hard to declare — a single sailboat thing is NOT a plausible composition here), rigidly shifted by one offset, both fully inside the lake (300-500 / 250-400). Part-level overlap with the lake edge or separate unrelated placements fail.',
});

CASES2.push({
  id: 'w5', family: 'query',
  world: DRAW2 + `
@lake draw.thing kind=lake x=300 y=250 w=200 h=150 colour=blue
@o1 draw.thing kind=boat x=330 y=270 w=60 h=30 colour=brown
@o2 draw.thing kind=boat x=420 y=300 w=60 h=30 colour=brown
@o3 draw.thing kind=tree x=100 y=100 w=80 h=80 colour=green`,
  intent: `
@i7 x.intent act=inspect note="how many boats are on the page?"
@i7.t1 x.target intent=$i7 kind=boat mode=existing
@i7.o1 x.option intent=$i7 key=operation value=count`,
  criteria: 'A read request, not a placement: there are exactly two boats on the page. Plausible output: one x.answer wire whose text is "2" (or equivalent wording with the number 2). Creating or changing things fails.',
});
CASES2.push({
  id: 'w6', family: 'draw',
  world: DRAW2 + `
@boat draw.thing kind=boat x=100 y=300 w=60 h=30 colour=brown
@house draw.thing kind=house x=400 y=280 w=120 h=100 colour=red`,
  intent: `
@i8 x.intent act=change note="move the boat to the right of the house"
@i8.t1 x.target intent=$i8 kind=boat mode=existing
@i8.r1 x.rel intent=$i8 kind=right target=$i8.t1 anchor=house`,
  criteria: 'The boat (100,300) must end up to the right of the house (400-520 / 280-380), disjoint from it, same size (60x30), on-page. Plausible: x.set wires that change the boat\'s x (and y if kept sensible), boat fully right of x=520 with a small gap. Recreating the boat elsewhere instead of moving the existing one is weaker.',
});

// ---- scale cases (deterministic, no randomness) ----
const busyScale = [];
for (let i = 0; i < 14; i++) { // a morning marathon: blocks every 18 minutes until ~13:20
  const start = i * 18, dur = 12;
  busyScale.push(`@sb${i} cal.event title="sb${i}" start=${start} end=${start + dur} person=Ana`);
}
CASES2.push({
  id: 's-cal', family: 'cal', scale: '14 busy meetings, 4 new 30-min meetings',
  world: CAL2 + '\n' + busyScale.join('\n'),
  intent: `
@i9 x.intent act=make note="schedule four more 30 minute meetings for Ana today"
@i9.t1 x.target intent=$i9 kind=event w=30 count=4 mode=new
@i9.o1 x.option intent=$i9 key=person value=Ana`,
  criteria: `Scale case: ${busyScale.length} busy blocks exist. Plausible: 4 new meetings, each inside 0-480, pairwise disjoint and disjoint from every busy block. Timing is the point: report how long compilation took.`,
});

const drawScale = [];
for (let i = 0; i < 40; i++) {
  const x = (i % 8) * 90 + 10, y = Math.floor(i / 8) * 90 + 10;
  drawScale.push(`@s${i} draw.thing kind=rectangle x=${x} y=${y} w=60 h=60 colour=green`);
}
CASES2.push({
  id: 's-draw', family: 'draw', scale: '40 existing objects, 6 new',
  world: DRAW2 + '\n' + drawScale.join('\n'),
  intent: `
@i10 x.intent act=make note="draw six circles around the middle of the page"
@i10.t1 x.target intent=$i10 kind=circle w=60 h=60 count=6 mode=new`,
  criteria: 'Scale case: 40 existing 60x60 rectangles fill an 8x5 grid. Plausible: 6 new circles on the page, pairwise disjoint, overlapping none of the 40. The page is crowded at the centre grid; gaps exist between the grid edge and the canvas edge. Timing matters.',
});

const storeScaleWorld = `
@sx core.use world=std.schema
@t.store.shelf core.type of=store.shelf closed=true
@s.sh.name core.slot of=store.shelf key=name present=true
@s.sh.cap core.slot of=store.shelf key=capacity kind=number required=true
@t.store.item core.type of=store.item closed=true
@s.it.name core.slot of=store.item key=name present=true
@s.it.size core.slot of=store.item key=size kind=number required=true
@t.store.put core.type of=store.put closed=true
@s.pu.item core.slot of=store.put key=item present=true
@s.pu.shelf core.slot of=store.put key=shelf present=true
${RULES}${CAPABILITIES}
@dc.assign dc.operation name="demo.assign" act=assign on=item
`;
const storeScale = [];
for (let i = 0; i < 12; i++) storeScale.push(`@sh${i} store.shelf name=s${i} capacity=7`);
for (let i = 0; i < 45; i++) storeScale.push(`@q${i} store.item name=q${i} size=${1 + (i % 3 === 2 ? 1 : 0)}`);
CASES2.push({
  id: 's-store', family: 'store', scale: '45 items, 12 shelves',
  world: storeScaleWorld + '\n' + storeScale.join('\n'),
  intent: `
@i11 x.intent act=assign note="assign all 45 items to the shelves, capacity 7 each; q0 and q1 must share a shelf"
@i11.t1 x.target intent=$i11 kind=item mode=existing
@i11.o1 x.option intent=$i11 key=with-pair value=q0,q1 strength=hard`,
  criteria: 'Scale case: 45 items (sizes 1-4), 12 shelves of capacity 7, q0 and q1 must share a shelf. Plausible: every item placed exactly once, capacities respected, the pair together. Timing matters.',
});

CASES2.push({
  id: 'w7', family: 'store', impossible: true,
  world: storeScaleWorld + `
@sh0 store.shelf name=only capacity=5
@x1 store.item name=x1 size=4
@x2 store.item name=x2 size=4
@x3 store.item name=x3 size=4`,
  intent: `
@i12 x.intent act=assign note="put these three 4-unit items on the shelf, capacity 5"
@i12.t1 x.target intent=$i12 kind=item mode=existing`,
  criteria: 'Deliberately impossible: three items of size 4 on one shelf of capacity 5. The RIGHT answer is a typed refusal that names the conflict (capacity), NOT a silently overloaded assignment. Ordering them elsewhere or dropping items is also wrong.',
});
