// Knowledge as a filler (Round 21): a drawing world that takes any kind the knowledge
// catalog names; a thing made without a place, a size or a colour gets the usual ones from
// the catalog's facts, with their source; a kind the catalog cannot draw is drawn as its
// stand-in. The knowledge wires below are copied unchanged from sop-knowledge-worlds
// (hand-written, `sources: hand-core`, license CC0-1.0). `node examples/know.mjs`
import { World } from '../src/index.mjs';

export const knowledge = String.raw`
@k.commonsense.fish k.commonsense.thing name=fish at=water can=swim used_for=food size=small core.source="hand-core 1"
@k.commonsense.sun k.commonsense.thing name=sun at=sky made_of=gas size=huge usually_count=1 core.source="hand-core 1"
@k.objects.robot.body k.objects.part of=robot name=body shape=rectangle x=25 y=34 w=50 h=38 z=2 colour=grey centered=true core.source="hand-core 1"
`;

// the drawing world: any kind the catalog names, as data
export const draw = String.raw`
@draw std.schema.world name=draw doc="any thing the knowledge catalog names"
@any std.schema.kinds world=draw from=k.known stand_in=k.stand_in acts=make acts=change acts=remove
@kn1 k.known name=fish  @kn2 k.known name=sun  @kn3 k.known name=robot
@si1 k.stand_in name=unicorn drawing=horse
`;

export function makeWorld() {
  const w = new World();
  w.load(['@acts core.use world=std.acts', '@know core.use world=std.know', draw].join('\n'));
  w.tell(knowledge);
  return w;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeWorld();
  for (const kind of ['fish', 'sun', 'robot', 'unicorn']) {
    const r = w.act({ action: 'make', args: { kind } });
    console.log(kind.padEnd(8), r.ok ? JSON.stringify({ attrs: w.get(r.result.thing).attrs, filled: r.result.filled, standIn: r.result.standIn }) : r.violations[0].why);
  }
}
