// ACTS × SCHEMAS (Round 20): two unrelated worlds, a seating plan and a face, declared as
// data only (std.schema) and driven by the same acts (std.acts); no rule of their own.
// `node examples/acts.mjs`
import { World } from '../src/index.mjs';

export const seating = String.raw`
@seating std.schema.world name=seating doc="tables, seats and guests"
@t.table core.type of=table extends=std.schema.thing closed=true
@t.seat core.type of=seat extends=std.schema.thing closed=true
@t.guest core.type of=guest extends=std.schema.thing closed=true
@s.table.name core.slot of=table key=name
@s.table.shape core.slot of=table key=shape enum=round enum=square default=round
@s.seat.table core.slot of=seat key=table type=table
@s.seat.colour core.slot of=seat key=colour enum=red enum=blue enum=green default=blue
@s.guest.name core.slot of=guest key=name required=true
@s.guest.seat core.slot of=guest key=seat type=seat
@s.guest.at core.slot of=guest key=at
@k.table std.schema.kind of=table world=seating acts=make acts=remove acts=change acts=pick acts=ask
@k.seat std.schema.kind of=seat world=seating acts=make acts=remove acts=change acts=connect acts=pick acts=ask acts=copy
@k.guest std.schema.kind of=guest world=seating acts=make acts=remove acts=change acts=place acts=group acts=pick acts=ask
@l.table std.schema.limit of=table max=10
`;

export const face = String.raw`
@face std.schema.world name=face doc="a face: eyes, mouth, glasses"
@t.eye core.type of=eye extends=std.schema.thing closed=true
@t.mouth core.type of=mouth extends=std.schema.thing closed=true
@t.glasses core.type of=glasses extends=std.schema.thing closed=true
@s.eye.colour core.slot of=eye key=colour enum=brown enum=blue enum=green default=brown
@s.eye.size core.slot of=eye key=size kind=number min=1 max=10 step=1 default=5
@s.eye.side core.slot of=eye key=side enum=left enum=right
@s.mouth.variant core.slot of=mouth key=variant enum=smile enum=flat enum=open default=smile
@s.glasses.variant core.slot of=glasses key=variant enum=round enum=square default=round
@s.glasses.colour core.slot of=glasses key=colour enum=black enum=red default=black
@k.eye std.schema.kind of=eye world=face acts=make acts=change acts=ask acts=copy
@k.mouth std.schema.kind of=mouth world=face acts=change acts=ask
@k.glasses std.schema.kind of=glasses world=face acts=make acts=remove acts=change acts=ask
@l.eye std.schema.limit of=eye max=2
`;

export function makeWorld(...schemas) {
  const w = new World();
  w.load(['@acts core.use world=std.acts', ...schemas].join('\n'));
  return w;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeWorld(seating, face);
  const say = (req) => {
    const r = w.act(req);
    const what = r.ok ? JSON.stringify(r.result) : `refused: ${r.violations[0].why}${r.violations[0].reason ? ' ' + JSON.stringify(r.violations[0].reason) : ''}`;
    console.log(`${req.action} ${JSON.stringify(req.args)}`.padEnd(60), what);
    return r;
  };
  say({ action: 'make', args: { kind: 'table', name: 'family' } });
  say({ action: 'make', args: { kind: 'seat', table: '$table1', id: 'seat1' } });
  say({ action: 'make', args: { kind: 'guest', name: 'Ana', seat: '$seat1' } });
  say({ action: 'change', args: { thing: 'seat', attr: 'colour', value: 'red' } });
  say({ action: 'make', args: { kind: 'eye', side: 'left' } });
  say({ action: 'make', args: { kind: 'eye', side: 'right' } });
  say({ action: 'make', args: { kind: 'eye' } });
  say({ action: 'change', args: { thing: 'eye', nth: 1, attr: 'size', by: 'more' } });
  say({ action: 'make', args: { kind: 'glasses', colour: 'red' } });
  say({ action: 'remove', args: { thing: 'glasses' } });
  say({ action: 'change', args: { thing: 'seat', attr: 'size', value: 3 } });
  say({ action: 'remove', args: { thing: 'mouth' } });
  const r = w.act({ action: 'change', args: { thing: 'guest', attr: 'name', value: 'Ana Maria' } });
  console.log('the difference of the last act:', JSON.stringify(r.diff.changed));
}
