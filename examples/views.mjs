// Shared things, several views (Round 22): a picture, a chart and a list over the same
// things; a thing made in one appears in the others it has the aspects for; a fact the
// user teaches ("a pony is a kind of horse") changes a default seen in all three.
// `node examples/views.mjs`
import { World } from '../src/index.mjs';
import { knowledge } from './know.mjs';

export const zoo = String.raw`
@zoo std.schema.world name=zoo doc="animals and the things around them"
@a.place std.schema.aspect name=place keys=place doc="place on Earth"
@a.size std.schema.aspect name=size keys=size doc="size"
@a.label std.schema.aspect name=label keys=kind doc="name"
@animals std.schema.kinds world=zoo from=k.commonsense.thing acts=make acts=change acts=show aspects=place aspects=size aspects=label
@t.table core.type of=table extends=std.schema.thing closed=true
@k.table std.schema.kind of=table world=zoo acts=make acts=show aspects=label
@picture std.schema.view name=picture shows=place shows=label
@chart std.schema.view name=chart shows=size shows=label
@list std.schema.view name=list shows=label shows=size shows=place
@k.horse k.commonsense.thing name=horse at=field size=large core.source="hand-core 1"
@k.pony k.commonsense.thing name=pony core.source="hand-core 1"
`;

export function makeWorld() {
  const w = new World();
  w.load(['@acts core.use world=std.acts', '@know core.use world=std.know', zoo].join('\n'));
  w.tell(knowledge);
  return w;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeWorld();
  const show = (view) => { const r = w.act({ action: 'show', args: { thing: '*', set: 'each', view } }); return r.ok ? r.result.things.map((t) => `${t.id} ${JSON.stringify(t.values)}`).join('; ') : r.violations[0].why; };
  w.act({ action: 'make', args: { kind: 'fish' } });
  w.act({ action: 'make', args: { kind: 'pony' } });
  console.log('picture:', show('picture'));
  console.log('chart:  ', show('chart'));
  w.act({ action: 'teach', args: { fact: '@pony.isa k.commonsense.thing name=pony is_a=horse', by: 'Ana' } });
  w.act({ action: 'make', args: { kind: 'pony' } });
  console.log('taught that a pony is a kind of horse; a new pony:');
  console.log('picture:', show('picture'));
  console.log('chart:  ', show('chart'));
  console.log('list:   ', show('list'));
  w.act({ action: 'make', args: { kind: 'table' } });
  console.log('the table in the picture:', w.act({ action: 'show', args: { thing: 'table', view: 'picture' } }).violations[0].why);
}
