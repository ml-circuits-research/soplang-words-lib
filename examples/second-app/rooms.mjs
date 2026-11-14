// A third application written from the documentation alone (01:20 item 3): a room planner.
// Space (std.boxes: a piece must stay inside its room, two pieces may not overlap),
// knowledge (the usual size of a piece from a catalog: one std.know.fill line), views
// (a floor plan view and a shopping view of the same pieces), and
// requests through `act` and `resolve`. Built from docs/quickstart.md, docs/capabilities.md,
// docs/reference.md and docs/api.md; where they were not enough is listed in
// docs/reuse-reports/apps.md. `node examples/second-app/rooms.mjs`
import { World, resolve } from '../../src/index.mjs';

export const ROOMS = String.raw`
@acts core.use world=std.acts
@boxes core.use world=std.boxes
@know core.use world=std.know
@home std.schema.world name=home doc="rooms and the furniture in them"
@t.room core.type of=room extends=std.schema.thing closed=true
@s.room.w core.slot of=room key=w kind=number min=50 required=true
@s.room.d core.slot of=room key=d kind=number min=50 required=true
@k.room std.schema.kind of=room world=home acts=make acts=change acts=remove acts=show
@any std.schema.kinds world=home from=k.furniture acts=make acts=change acts=remove acts=place acts=show aspects=plan aspects=buy
@a.plan std.schema.aspect name=plan keys=in keys=x keys=y keys=w keys=d doc="where a piece stands"
@a.buy std.schema.aspect name=buy keys=price keys=colour doc="what a piece costs"
@v.plan std.schema.view name=floor shows=plan
@v.buy std.schema.view name=shopping shows=buy

# the usual size and price of a piece, from the catalog, when the request leaves them out
@kf std.know.fill from=k.furniture match=name key=w key=d key=price

# a piece stays inside its room
@rm room w=?rw d=?rd
@pin std.schema.thing in=$rm x=?x y=?y w=?w d=?d
@inside core.calc out=?ok fn=contains_box args=0 args=0 args=?rw args=?rd args=?x args=?y args=?w args=?d
@out core.check fn=eq args=?ok args=false
@stays core.deny when=$rm when=$pin with=$inside if=$out why="it does not fit in the room there"

# two pieces in one room do not overlap
@rm2 room
@pa std.schema.thing in=$rm2 x=?ax y=?ay w=?aw d=?ad
@pb std.schema.thing in=$rm2 x=?bx y=?by w=?bw d=?bd
@two core.check fn=neq args=$pa args=$pb
@hit core.calc out=?o fn=overlaps args=?ax args=?ay args=?aw args=?ad args=?bx args=?by args=?bw args=?bd
@yes core.check fn=eq args=?o args=true
@apart core.deny when=$rm2 when=$pa when=$pb if=$two with=$hit if=$yes why="it would stand on another piece"
`;

// the catalog: the usual size (cm) and price of a piece; in an application, a knowledge world
export const FURNITURE = String.raw`
@f.sofa k.furniture name=sofa w=200 d=90 price=600 core.source="shop list"
@f.bed k.furniture name=bed w=160 d=200 price=450 core.source="shop list"
@f.desk k.furniture name=desk w=120 d=60 price=150 core.source="shop list"
@f.lamp k.furniture name=lamp w=30 d=30 price=40 core.source="shop list"
`;

export function makeApp() { const w = new World(); w.load(ROOMS); w.tell(FURNITURE); return w; }

// the words the host reads requests with: a tiny grammar of its own, and the lexicon
export const GRAMMAR = String.raw`
@d1 r.det text=the  @d2 r.det text=a  @o1 r.ord text=first value=1  @o2 r.ord text=last value=-1
@n1 r.rule lhs=NP rhs=DET? rhs=ORD? rhs=MOD* rhs=N head=N  @n2 r.rule lhs=NP rhs=everything
@c r.coord word=and
`;
export const words = {
  grammar: { types: { rule: 'r.rule', coord: 'r.coord' }, classes: { DET: 'r.det', ORD: 'r.ord' },
    lexicon: { sofa: { cat: 'N' }, bed: { cat: 'N' }, desk: { cat: 'N' }, lamp: { cat: 'N' }, lamps: { cat: 'N', lemma: 'lamp' }, room: { cat: 'N' }, couch: { cat: 'N' }, red: { cat: 'MOD' }, grey: { cat: 'MOD' } } },
  cats: { det: 'DET', mod: 'MOD', head: 'N', ord: 'ORD' },
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeApp();
  w.tell(GRAMMAR + '\n@syn core.word text=couch means=sofa');
  const say = (label, r) => console.log(label.padEnd(30), r.ok ? 'ok' : `refused: ${r.violations?.[0]?.why ?? r.why}`);
  say('make a room 400 x 300', w.act({ action: 'make', args: { kind: 'room', w: 400, d: 300 } }));
  say('make a grey sofa at 0,0', w.act({ action: 'make', args: { kind: 'sofa', in: '$room1', x: 0, y: 0, colour: 'grey' } }));
  console.log('  filled from the catalog:', JSON.stringify(w.get('sofa1').attrs.w), JSON.stringify(w.get('sofa1').attrs.price));
  say('make a desk at 100,50', w.act({ action: 'make', args: { kind: 'desk', in: '$room1', x: 100, y: 50 } }));
  say('make a desk at 250,0', w.act({ action: 'make', args: { kind: 'desk', in: '$room1', x: 250, y: 0 } }));
  say('make a bed at 300,100', w.act({ action: 'make', args: { kind: 'bed', in: '$room1', x: 300, y: 100 } }));
  const couch = resolve(w, 'the couch', words);
  console.log('"the couch" is', JSON.stringify(couch));
  say('move the couch to y 250', w.act({ action: 'change', args: { thing: couch.ids[0], attr: 'y', value: 250 } }));
  say('move the couch to x 150', w.act({ action: 'change', args: { thing: couch.ids[0], attr: 'x', value: 150 } }));
  say('move the couch to y 200', w.act({ action: 'change', args: { thing: couch.ids[0], attr: 'y', value: 200 } }));
  const lamps = w.act([{ action: 'make', args: { kind: 'lamp', in: '$room1', x: 10, y: 10 } }, { action: 'make', args: { kind: 'lamp', in: '$room1', x: 360, y: 260 } }]);
  say('make two lamps (one sentence)', lamps);
  console.log('"the last lamp" is', resolve(w, 'the last lamp', words).ids, '; "the lamp and the desk":', resolve(w, 'the lamp and the desk', words).why ?? '');
  const show = (view) => { const r = w.act({ action: 'show', args: { thing: '*', set: 'each', view } }).result; return r.things.map((t) => `${t.id} ${JSON.stringify(t.values)}`).join('\n  ') + (r.skipped ? `\n  (not in this view: ${r.skipped.join(', ')})` : ''); };
  console.log('floor plan:\n ', show('floor'));
  console.log('shopping:\n ', show('shopping'));
}
