// The corpus: small demo worlds, intent circuits (input) and agent-judge rubrics.
// Each case is a real SOP world (schema + facts) plus an intent packet in x.* wires.
const INTENT_SCHEMA = `
@xs core.use world=std.schema
@t.x.intent core.type of=x.intent closed=true
@s.x.intent.act core.slot of=x.intent key=act enum=make enum=change enum=assign present=true
@s.x.intent.note core.slot of=x.intent key=note kind=string
@t.x.target core.type of=x.target closed=true
@s.x.target.intent core.slot of=x.target key=intent present=true
@s.x.target.kind core.slot of=x.target key=kind present=true
@s.x.target.count core.slot of=x.target key=count kind=number
@s.x.target.w core.slot of=x.target key=w kind=number
@s.x.target.h core.slot of=x.target key=h kind=number
@s.x.target.mode core.slot of=x.target key=mode enum=new enum=existing
@s.x.target.colour core.slot of=x.target key=colour enum=red enum=blue enum=green enum=brown enum=yellow
@t.x.rel core.type of=x.rel closed=true
@s.x.rel.intent core.slot of=x.rel key=intent present=true
@s.x.rel.kind core.slot of=x.rel key=kind enum=on enum=near enum=in enum=with enum=after present=true
@s.x.rel.target core.slot of=x.rel key=target
@s.x.rel.anchor core.slot of=x.rel key=anchor
@s.x.rel.gap core.slot of=x.rel key=gap kind=number
@t.x.option core.type of=x.option closed=true
@s.x.option.intent core.slot of=x.option key=intent present=true
@s.x.option.key core.slot of=x.option key=key present=true
@s.x.option.value core.slot of=x.option key=value
@s.x.option.strength core.slot of=x.option key=strength enum=hard enum=soft
`;

const DRAWING_SCHEMA = `
@dx core.use world=std.schema
@t.draw.region core.type of=draw.region closed=true
@s.rg.name core.slot of=draw.region key=name present=true
@s.rg.x core.slot of=draw.region key=x kind=number required=true
@s.rg.y core.slot of=draw.region key=y kind=number required=true
@s.rg.w core.slot of=draw.region key=w kind=number required=true
@s.rg.h core.slot of=draw.region key=h kind=number required=true
@page draw.region name=page x=0 y=0 w=800 h=600
@sky draw.region name=sky x=0 y=0 w=800 h=150
@t.draw.thing core.type of=draw.thing closed=true
@s.d.kind core.slot of=draw.thing key=kind enum=circle enum=rectangle enum=tree enum=house enum=boat enum=sun enum=lake present=true
@s.d.x core.slot of=draw.thing key=x kind=number min=0 max=800 required=true
@s.d.y core.slot of=draw.thing key=y kind=number min=0 max=600 required=true
@s.d.w core.slot of=draw.thing key=w kind=number min=1 max=800 required=true
@s.d.h core.slot of=draw.thing key=h kind=number min=1 max=600 required=true
@s.d.colour core.slot of=draw.thing key=colour enum=red enum=blue enum=green enum=brown enum=yellow present=true
@t.x.set core.type of=x.set closed=true
@s.xs.object core.slot of=x.set key=object present=true
@s.xs.key core.slot of=x.set key=key present=true
@s.xs.value core.slot of=x.set key=value present=true
`;

// The intent packet references anchors by name (lake, tree, pond, c2): repository ids,
// not packet refs. Output elementary wires: draw.thing facts (create), x.set (change).
export const CASES = [
  {
    id: 'd1', family: 'draw',
    world: DRAWING_SCHEMA + `
@lake draw.thing kind=lake x=300 y=250 w=200 h=150 colour=blue`,
    intent: `
@i1 x.intent act=make note="draw a boat on the lake"
@i1.t1 x.target intent=$i1 kind=boat w=60 h=30 mode=new
@i1.r1 x.rel intent=$i1 kind=on target=$i1.t1 anchor=lake`,
    criteria: 'Intent: draw a 60x30 boat placed on the lake (the lake occupies x 300-500, y 250-400). Plausible means: the boat is inside or mostly over the lake area, fully on the page, with a colour that suits a boat better than a lake.',
  },
  {
    id: 'd2', family: 'draw',
    world: DRAWING_SCHEMA,
    intent: `
@i2 x.intent act=make note="draw three circles that do not overlap, roughly around the middle of the page"
@i2.t1 x.target intent=$i2 kind=circle w=60 h=60 count=3 mode=new`,
    criteria: 'Intent: three 60x60 circles near the centre of an 800x600 page, without overlapping each other. Plausible means: inside the page, pairwise disjoint, and the group reasonably clustered around the middle (not all shoved into a corner).',
  },
  {
    id: 'd3', family: 'draw',
    world: DRAWING_SCHEMA + `
@tree draw.thing kind=tree x=100 y=100 w=80 h=80 colour=green`,
    intent: `
@i3 x.intent act=make note="draw a house near the tree"
@i3.t1 x.target intent=$i3 kind=house w=100 h=80 mode=new
@i3.r1 x.rel intent=$i3 kind=near target=$i3.t1 anchor=tree gap=40`,
    criteria: 'Intent: a 100x80 house near the existing tree (tree occupies x 100-180, y 100-180). Plausible means: not overlapping the tree, within roughly 0-60 units of it (a visible gap, but clearly "near"), inside the page.',
  },
  {
    id: 'd4', family: 'draw',
    world: DRAWING_SCHEMA,
    intent: `
@i4 x.intent act=make note="draw a sun in the sky area at the top"
@i4.t1 x.target intent=$i4 kind=sun w=50 h=50 mode=new
@i4.r1 x.rel intent=$i4 kind=in target=$i4.t1 anchor=sky`,
    criteria: 'Intent: a 50x50 sun in the sky region (y 0-150 of an 800x600 page). Plausible means: fully inside the top strip, yellow or otherwise sensible sun colour, inside the page.',
  },
  {
    id: 'd5', family: 'draw',
    world: DRAWING_SCHEMA + `
@pond draw.thing kind=lake x=500 y=380 w=160 h=100 colour=blue`,
    intent: `
@i5 x.intent act=make note="draw a house and a tree, both near the pond, without touching it"
@i5.t1 x.target intent=$i5 kind=house w=100 h=80 mode=new
@i5.t2 x.target intent=$i5 kind=tree w=60 h=100 mode=new
@i5.r1 x.rel intent=$i5 kind=near target=$i5.t1 anchor=pond gap=50
@i5.r2 x.rel intent=$i5 kind=near target=$i5.t2 anchor=pond gap=50`,
    criteria: 'Intent: a house (100x80) and a tree (60x100), each near the pond (pond at x 500-660, y 380-480), none overlapping the pond or each other, inside the page. Plausible means: both object groups visibly near the pond with a small gap, all disjoint, all on the page.',
  },
  {
    id: 'd6', family: 'draw',
    world: DRAWING_SCHEMA + `
@c1 draw.thing kind=circle x=200 y=200 w=60 h=60 colour=red
@c2 draw.thing kind=circle x=400 y=300 w=60 h=60 colour=blue`,
    intent: `
@i6 x.intent act=change note="make the blue circle green"
@i6.t1 x.target intent=$i6 kind=circle mode=existing colour=blue
@i6.o1 x.option intent=$i6 key=colour value=green`,
    criteria: 'Intent: recolour the blue circle (the circle at x 400 y 300) to green. Plausible means: an elementary change of exactly that circle to green, leaving the red circle untouched.',
  },

  {
    id: 'c1', family: 'cal',
    world: `
@cx core.use world=std.schema
@t.cal.event core.type of=cal.event closed=true
@s.e.title core.slot of=cal.event key=title kind=string present=true
@s.e.start core.slot of=cal.event key=start kind=number min=0 max=480 required=true
@s.e.end core.slot of=cal.event key=end kind=number min=0 max=480 required=true
@s.e.person core.slot of=cal.event key=person enum=Ana enum=Dan enum=Bob present=true
@busy1 cal.event title="standup" start=60 end=120 person=Ana`,
    intent: `
@i7 x.intent act=make note="schedule a 30 minute meeting for Ana as early as possible; the day runs from minute 0 to 480 since 09:00"
@i7.t1 x.target intent=$i7 kind=event w=30 mode=new
@i7.o1 x.option intent=$i7 key=person value=Ana`,
    criteria: 'Time unit: minutes since 09:00, day is 0-480. Ana is busy 60-120 (an existing "standup"). Intent: a 30 minute meeting for Ana, earliest possible. Plausible means: inside the working day, not overlapping the busy block; ideally at 0-30 (09:00-09:30). Later free slots are still plausible but weaker.',
  },
  {
    id: 'c2', family: 'cal',
    world: `
@cx core.use world=std.schema
@t.cal.event core.type of=cal.event closed=true
@s.e.title core.slot of=cal.event key=title kind=string present=true
@s.e.start core.slot of=cal.event key=start kind=number min=0 max=480 required=true
@s.e.end core.slot of=cal.event key=end kind=number min=0 max=480 required=true
@s.e.person core.slot of=cal.event key=person enum=Ana enum=Dan enum=Bob present=true
@busy1 cal.event title="standup" start=60 end=120 person=Ana`,
    intent: `
@i8 x.intent act=make note="schedule a 45 minute meeting for Ana that starts at or after minute 90 (10:30)"
@i8.t1 x.target intent=$i8 kind=event w=45 mode=new
@i8.o1 x.option intent=$i8 key=person value=Ana
@i8.o2 x.option intent=$i8 key=start-min value=90 strength=hard`,
    criteria: 'Time unit: minutes since 09:00, day is 0-480. Ana busy 60-120. Intent: 45 minutes starting at or after minute 90. Plausible means: start>=90, inside 0-480, no overlap with the busy block; ideally 120-165 (11:00), since 90-135 would overlap.',
  },
  {
    id: 'c3', family: 'cal',
    world: `
@cx core.use world=std.schema
@t.cal.event core.type of=cal.event closed=true
@s.e.title core.slot of=cal.event key=title kind=string present=true
@s.e.start core.slot of=cal.event key=start kind=number min=0 max=480 required=true
@s.e.end core.slot of=cal.event key=end kind=number min=0 max=480 required=true
@s.e.person core.slot of=cal.event key=person enum=Ana enum=Dan enum=Bob present=true`,
    intent: `
@i9 x.intent act=make note="schedule two separate 60 minute meetings for Ana in the day; the day runs 0-480"
@i9.t1 x.target intent=$i9 kind=event w=60 count=2 mode=new
@i9.o1 x.option intent=$i9 key=person value=Ana`,
    criteria: 'Intent: two 60-minute meetings for Ana, both inside 0-480, not overlapping each other. Plausible: both fit, disjoint, no other hard requirement.',
  },
  {
    id: 'c4', family: 'cal',
    world: `
@cx core.use world=std.schema
@t.cal.event core.type of=cal.event closed=true
@s.e.title core.slot of=cal.event key=title kind=string present=true
@s.e.start core.slot of=cal.event key=start kind=number min=0 max=480 required=true
@s.e.end core.slot of=cal.event key=end kind=number min=0 max=480 required=true
@s.e.person core.slot of=cal.event key=person enum=Ana enum=Dan enum=Bob present=true
@busy1 cal.event title="block" start=60 end=90 person=Ana`,
    intent: `
@i10 x.intent act=make note="schedule a 90 minute meeting for Ana as early as possible"
@i10.t1 x.target intent=$i10 kind=event w=90 mode=new
@i10.o1 x.option intent=$i10 key=person value=Ana`,
    criteria: 'Ana busy 60-90 (a 90 minute block). Intent: a 90 minute meeting, earliest. Correct search: 0-90 collides with 60-90, so the earliest is 90-180 (11:30-13:00). Anything disjoint from 60-90 and inside 0-480 is plausible; earliest is the strongest.',
  },
  {
    id: 'c5', family: 'cal',
    world: `
@cx core.use world=std.schema
@t.cal.event core.type of=cal.event closed=true
@s.e.title core.slot of=cal.event key=title kind=string present=true
@s.e.start core.slot of=cal.event key=start kind=number min=0 max=480 required=true
@s.e.end core.slot of=cal.event key=end kind=number min=0 max=480 required=true
@s.e.person core.slot of=cal.event key=person enum=Ana enum=Dan enum=Bob present=true
@busyD cal.event title="dan-block" start=300 end=360 person=Dan`,
    intent: `
@i11 x.intent act=make note="schedule a 60 minute meeting for Dan in the afternoon (start at or after minute 240)"
@i11.t1 x.target intent=$i11 kind=event w=60 mode=new
@i11.o1 x.option intent=$i11 key=person value=Dan
@i11.o2 x.option intent=$i11 key=start-min value=240 strength=hard`,
    criteria: 'Dan busy 300-360. Intent: 60 minutes starting at or after 240. Plausible: disjoint from 300-360, start>=240, inside 0-480; 240-300 is the ideal, 360-420 acceptable.',
  },

  {
    id: 's1', family: 'store',
    world: `
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
@shelf-a store.shelf name=a capacity=3
@shelf-b store.shelf name=b capacity=3
@it1 store.item name=i1 size=1
@it2 store.item name=i2 size=1
@it3 store.item name=i3 size=1
@it4 store.item name=i4 size=1
@it5 store.item name=i5 size=1`,
    intent: `
@i12 x.intent act=assign note="assign all five items to the two shelves, respecting capacity 3 per shelf"
@i12.t1 x.target intent=$i12 kind=item mode=existing`,
    criteria: 'Intent: place all 5 unit-size items on shelves a/b, capacity 3 each. Plausible: every item assigned exactly once, no shelf above capacity.',
  },
  {
    id: 's2', family: 'store',
    world: `
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
@shelf-a store.shelf name=a capacity=5
@shelf-b store.shelf name=b capacity=5
@it1 store.item name=i1 size=3
@it2 store.item name=i2 size=3
@it3 store.item name=i3 size=2
@it4 store.item name=i4 size=2`,
    intent: `
@i13 x.intent act=assign note="assign the four items (sizes 3,3,2,2) to the two shelves, capacity 5 each"
@i13.t1 x.target intent=$i13 kind=item mode=existing`,
    criteria: 'Intent: assign items sized 3,3,2,2 to two shelves of capacity 5. Plausible: each item once, capacities respected (3+2 on one shelf and 3+2 on the other, or equivalent).',
  },
  {
    id: 's3', family: 'store',
    world: `
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
@shelf-a store.shelf name=a capacity=4
@shelf-b store.shelf name=b capacity=4
@shelf-c store.shelf name=c capacity=4
@it1 store.item name=i1 size=2
@it2 store.item name=i2 size=2
@it3 store.item name=i3 size=2
@it4 store.item name=i4 size=2
@it5 store.item name=i5 size=1
@it6 store.item name=i6 size=3`,
    intent: `
@i14 x.intent act=assign note="assign all six items (sizes 2,2,2,2,1,3) to the shelves (capacity 4 each); i1 and i2 must share a shelf"
@i14.t1 x.target intent=$i14 kind=item mode=existing
@i14.o2 x.option intent=$i14 key=with-pair value=i1,i2 strength=hard`,
    criteria: 'Intent: assign six items sized 2,2,2,2,1,3 to three shelves of capacity 4; items i1 and i2 must share a shelf. Plausible: all assigned once, capacities respected, i1 and i2 together.',
  },
];

// The shared intent schema is prepended by the harness when a case is run.
export const COMMON_INTENT = INTENT_SCHEMA;
