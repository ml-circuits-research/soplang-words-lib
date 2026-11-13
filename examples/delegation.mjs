// Delegation between modules with what the language already has (Round 18): a draw world
// needs a place for a thing when the user gave none; a dialogue module and a knowledge
// module offer one; the draw world takes the offer of the best rank and records where the
// value came from. Rules, core.absent=, aggregates and a soft deny; no new construct.
// `node examples/delegation.mjs`
import { World } from '../src/index.mjs';

// The modules, as a host's library. Ranks are the declared order of fillers:
// 1 the user, 2 the dialogue focus, 3 the scene, 4 knowledge, 5 the draw world's own default.
export const library = {
  // the draw world: requests, what it needs, how it chooses
  draw: `
@draw core.module name=draw exports=request exports=offer exports=best exports=at_rank
@draw.k.thing core.slot of=draw.request key=thing required=true
@draw.k.rank core.slot of=draw.offer key=rank kind=integer min=1 max=5

# 1. the user said where: that is the place
@draw.told draw.request thing=?t place=?p
@draw.from.user draw.request core.on=$draw.told use_place=?p place_source=user
@draw.user core.rule when=$draw.told then=$draw.from.user

# the gap: a request with no place; each module may answer it with a draw.offer
# 5. the draw world's own default, the last resort
@draw.gap draw.request thing=?t core.absent=place
@draw.own draw.offer for=$draw.gap value=centre source=draw rank=5
@draw.default core.rule when=$draw.gap then=$draw.own

# the best rank offered for each request, and how many offers each rank has
@draw.o draw.offer for=?req rank=?r
@draw.low core.aggregate over=$draw.o by=?req min=?m args=?r then=$draw.bs
@draw.bs draw.best req=?req rank=?m
@draw.cnt core.aggregate over=$draw.o by=?req by=?r count=?n then=$draw.at
@draw.at draw.at_rank req=?req rank=?r n=?n

# take the offer of the best rank when it is the only one at that rank
@draw.req draw.request thing=?t core.absent=place
@draw.top draw.best req=$draw.req rank=?m
@draw.alone draw.at_rank req=$draw.req rank=?m n=1
@draw.first draw.offer for=$draw.req rank=?m value=?v source=?s
@draw.take draw.request core.on=$draw.req use_place=?v place_source=?s
@draw.choose core.rule when=$draw.req when=$draw.top when=$draw.alone when=$draw.first then=$draw.take

# two offers at the best rank: reported (an issue), nothing picked
@draw.top2 draw.best req=?q rank=?m2
@draw.two draw.at_rank req=?q rank=?m2 n=?n
@draw.many core.check fn=gt args=?n args=1
@draw.tie core.deny when=$draw.top2 when=$draw.two if=$draw.many soft=true why="?n offers at the same rank for ?q"
`,
  // the dialogue module: the last thing talked about has a place
  talk: `
@talk core.module name=talk imports=draw exports=focus
@talk.gap draw.request thing=?t core.absent=place
@talk.last talk.focus thing=?t place=?p
@talk.offer draw.offer for=$talk.gap value=?p source=talk rank=2
@talk.r core.rule when=$talk.gap when=$talk.last then=$talk.offer
`,
  // the knowledge module: the usual place of a thing
  know: `
@know core.module name=know imports=draw exports=usual
@know.gap draw.request thing=?t core.absent=place
@know.usual know.usual thing=?t place=?p
@know.offer draw.offer for=$know.gap value=?p source=know rank=4
@know.r core.rule when=$know.gap when=$know.usual then=$know.offer
`,
};

export function makeWorld() {
  const w = new World({ library });
  const r = w.tell('@app core.module name=app imports=draw imports=talk imports=know');
  if (!r.ok) throw new Error(JSON.stringify(r.violations[0]));
  return w;
}

/** Where a request's place came from: { place, source } or the reason there is none. */
export function placeOf(w, id) {
  const r = w.get(id);
  if (r.attrs.use_place) return { place: r.attrs.use_place[0], source: r.attrs.place_source[0] };
  const issue = w.ofType('core.issue').find((i) => i.attrs.about.some((a) => w.get(a.slice(1))?.attrs.req?.[0] === '$' + id));
  return { place: null, why: issue ? issue.attrs.why[0] : 'no offer' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeWorld();
  w.tell('@u1 know.usual thing=cup place=table  @u2 know.usual thing=boat place=sea');
  w.tell('@q1 draw.request thing=cup  @q2 draw.request thing=boat place=sky  @q3 draw.request thing=kite');
  for (const id of ['q1', 'q2', 'q3']) console.log(id, placeOf(w, id));
  w.tell('@f1 talk.focus thing=cup place=shelf');
  console.log('q1 after the dialogue spoke of the cup on the shelf:', placeOf(w, 'q1'));
}
