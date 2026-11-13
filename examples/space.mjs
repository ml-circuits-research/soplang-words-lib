// A small space world written with the standard function pack and rules only: five items
// in a frame, with boxes; "the middle one", "left of" and "in a row" are derived.
// `node examples/space.mjs`
import { World } from '../src/index.mjs';

export const space = `
@use.boxes core.use world=std.boxes
@use.numbers core.use world=std.numbers
@k.x core.slot of=item key=x kind=number
@k.y core.slot of=item key=y kind=number
@k.w core.slot of=item key=w kind=number
@k.h core.slot of=item key=h kind=number
@k.frame core.slot of=frame key=name id=true

# the centre of each item
@b item in=?f x=?x y=?y w=?w h=?h
@cx core.calc out=?cx fn=centre_x args=?x args=?w
@cy core.calc out=?cy fn=centre_y args=?y args=?h
@bc item core.on=$b cx=?cx cy=?cy
@centre core.rule when=$b with=$cx with=$cy then=$bc

# the place of each item from the left, and how many items the frame has
@c item in=?f cx=?cxv
@place core.rank of=$c by=cx within=?f out=?place
@cp item core.on=$c place=?place
@placed core.rule when=$c with=$place then=$cp
@m item in=?g
@size core.aggregate over=$m by=?g count=?n then=$fs
@fs frame name=?g items=?n

# the middle one: its place is (items + 1) / 2
@mi item in=?f place=?p
@mf frame name=?f items=?n
@half1 core.calc out=?n1 fn=add args=?n args=1
@half2 core.calc out=?mid fn=div args=?n1 args=2
@is core.check fn=eq args=?p args=?mid
@mm middle of=$mf item=$mi
@middle core.rule when=$mi when=$mf with=$half1 with=$half2 if=$is then=$mm

# left of: in the same frame, a centre further left
@la item in=?f cx=?ax
@lb item in=?f cx=?bx
@lt core.check fn=lt args=?ax args=?bx
@lo left_of a=$la b=$lb
@leftof core.rule when=$la when=$lb if=$lt then=$lo

# in a row: the centres of a frame's items differ by at most 10 downwards
@ry item in=?f cy=?y
@low core.aggregate over=$ry by=?f min=?lo args=?y then=$rlo
@high core.aggregate over=$ry by=?f max=?hi args=?y then=$rhi
@rlo frame name=?f top=?lo
@rhi frame name=?f bottom=?hi
@sp frame name=?f top=?t bottom=?u
@spread core.calc out=?d fn=sub args=?u args=?t
@flat core.check fn=lte args=?d args=10
@row in_a_row frame=$sp
@rowrule core.rule when=$sp with=$spread if=$flat then=$row
`;

export const items = `
@f1 frame name=shelf
@i1 item in=shelf name=cup x=10 y=40 w=10 h=10
@i2 item in=shelf name=book x=30 y=38 w=8 h=14
@i3 item in=shelf name=lamp x=50 y=36 w=10 h=16
@i4 item in=shelf name=clock x=70 y=40 w=10 h=10
@i5 item in=shelf name=vase x=90 y=42 w=6 h=8
`;

export function makeSpace() {
  const w = new World();
  const r = w.load(space);
  if (!r.ok) throw new Error(JSON.stringify(r.violations[0]));
  w.tell(items);
  return w;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeSpace();
  const name = (ref) => w.get(ref.slice(1)).attrs.name[0];
  console.log('the middle one:', w.ofType('middle').map((m) => name(m.attrs.item[0])));
  console.log('left of the lamp:', w.ofType('left_of').filter((l) => name(l.attrs.b[0]) === 'lamp').map((l) => name(l.attrs.a[0])));
  console.log('in a row:', w.ofType('in_a_row').length === 1);
}
