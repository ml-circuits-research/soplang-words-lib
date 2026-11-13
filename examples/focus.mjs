// std.focus (Round 19): a dialogue keeps its thing and its action over turns. "Draw a
// cup", "a red one", "move it right", "and lower": the requests that leave out the thing
// or the action are completed from the focus after the turn before, through std.fill.
// The host writes: one turn per request, a mention per key a request names, a need per
// key it leaves out. `node examples/focus.mjs`
import { World } from '../src/index.mjs';

export const KEYS = ['action', 'thing'];      // what the focus completes
export const NAMED = ['action', 'thing', 'place']; // what a request may name and the focus keeps

export const matrix = String.raw`
@use core.use world=std.focus
@k.action core.slot of=draw.request key=action
@k.thing core.slot of=draw.request key=thing

# every request is a turn of the dialogue "main"
@any draw.request
@turn std.focus.turn of=$any in=main
@r.turn core.rule when=$any then=$turn

# what a request names is a mention
${NAMED.map((k) => `@said.${k} draw.request ${k}=?v
@m.${k} std.focus.mention of=$said.${k} kind=${k} value=?v
@r.m.${k} core.rule when=$said.${k} then=$m.${k}`).join('\n')}

# what it leaves out is a need (std.fill chooses; std.focus offers in tier focus)
${KEYS.map((k) => `@gap.${k} draw.request core.absent=${k}
@n.${k} std.fill.need for=$gap.${k} key=${k}
@r.n.${k} core.rule when=$gap.${k} then=$n.${k}`).join('\n')}
`;

export function makeWorld() {
  const w = new World();
  w.load(matrix);
  return w;
}

/** What a request does, told or completed: { action, thing } with null where nothing completes it. */
export function readOf(w, id) {
  const req = w.get(id), out = {};
  for (const k of KEYS) {
    const need = w.ofType('std.fill.need').find((n) => n.attrs.for[0] === '$' + id && n.attrs.key[0] === k);
    out[k] = req.attrs[k]?.[0] ?? need?.attrs.value?.[0] ?? null;
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeWorld();
  const turns = [
    ['q1', 'draw a cup on the table', 'action=draw thing=cup place=table'],
    ['q2', 'a red one', 'colour=red'],
    ['q3', 'move it right', 'action=move direction=right'],
    ['q4', 'and lower', 'direction=down'],
    ['q5', 'now draw a boat', 'action=draw thing=boat'],
    ['q6', 'smaller', 'size=small'],
  ];
  for (const [id, text, attrs] of turns) {
    w.tell(`@${id} draw.request ${attrs}`);
    console.log(text.padEnd(26), JSON.stringify(readOf(w, id)));
  }
  console.log('focus now:', w.ofType('std.focus.last').map((l) => `${l.attrs.kind[0]}=${l.attrs.value?.[0] ?? '-'}`).join(' '));
}
