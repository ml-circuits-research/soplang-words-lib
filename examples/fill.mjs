// std.fill (Round 19): a draw request may leave out where a thing goes, how big it is and
// what colour it is; other modules offer values, each in a named tier (user, focus, scene,
// knowledge, default), and std.fill takes the offer of the best tier, for each key on its own.
// The host writes one rule per key that says "this key is missing"; the fillers are written
// once for every key. `node examples/fill.mjs`
import { World } from '../src/index.mjs';

export const KEYS = ['place', 'size', 'colour'];

export const matrix = String.raw`
@use core.use world=std.fill
@k.thing core.slot of=draw.request key=thing required=true
${KEYS.map((k) => `@k.${k} core.slot of=draw.request key=${k}`).join('\n')}

# the host: a request without a key needs a value for it (one rule per key)
${KEYS.map((k) => `@gap.${k} draw.request thing=?t core.absent=${k}
@need.${k} std.fill.need for=$gap.${k} key=${k}
@ask.${k} core.rule when=$gap.${k} then=$need.${k}`).join('\n')}

# the fillers, written once for every key: a need, the request it is for, and what each knows
@q draw.request thing=?t
@n std.fill.need for=$q key=?k

# user: what the user asked for every thing ("make everything red")
@said user.said key=?k value=?v
@o.user std.fill.offer for=$n value=?v tier=user source=user
@r.user core.rule when=$q when=$n when=$said then=$o.user

# focus: what the dialogue said last about this thing
@last talk.focus thing=?t key=?k value=?v
@o.focus std.fill.offer for=$n value=?v tier=focus source=talk
@r.focus core.rule when=$q when=$n when=$last then=$o.focus

# scene: what the other things of its kind in the scene have
@seen scene.has thing=?t key=?k value=?v
@o.scene std.fill.offer for=$n value=?v tier=scene source=scene
@r.scene core.rule when=$q when=$n when=$seen then=$o.scene

# knowledge: the usual value for this thing
@usual know.usual thing=?t key=?k value=?v
@o.know std.fill.offer for=$n value=?v tier=knowledge source=know
@r.know core.rule when=$q when=$n when=$usual then=$o.know

# default: the draw world's own value for the key
@dflt draw.default key=?k value=?v
@o.dflt std.fill.offer for=$n value=?v tier=default source=draw
@r.dflt core.rule when=$q when=$n when=$dflt then=$o.dflt

@d1 draw.default key=place value=centre
@d2 draw.default key=size value=medium
@d3 draw.default key=colour value=black
`;

export function makeWorld() {
  const w = new World();
  w.load(matrix);
  return w;
}

/** For each key of a request: what the user told, or the value chosen and where it came from, or why none was. */
export function valuesOf(w, id) {
  const req = w.get(id), out = {};
  for (const k of KEYS) {
    if (req.attrs[k]) { out[k] = { value: req.attrs[k][0], tier: 'told' }; continue; }
    const need = w.ofType('std.fill.need').find((n) => n.attrs.for[0] === '$' + id && n.attrs.key[0] === k);
    if (need?.attrs.value) { out[k] = { value: need.attrs.value[0], tier: need.attrs.tier[0], source: need.attrs.source[0] }; continue; }
    const issue = need && w.ofType('core.issue').find((i) => i.attrs.about.includes('$' + need.id));
    out[k] = { value: null, why: issue ? JSON.parse(issue.attrs.why[0]) : 'no offer' };
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeWorld();
  const show = (label) => console.log(label, JSON.stringify(valuesOf(w, 'q1')));
  w.tell('@u1 know.usual thing=cup key=place value=table  @u2 know.usual thing=cup key=colour value=white');
  w.tell('@q1 draw.request thing=cup');
  show('a cup:');
  w.tell('@s1 scene.has thing=cup key=size value=small');
  show('the other cups are small:');
  w.tell('@f1 talk.focus thing=cup key=place value=shelf');
  show('we spoke of the cup on the shelf:');
  w.tell('@p1 user.said key=colour value=red');
  show('make everything red:');
}
