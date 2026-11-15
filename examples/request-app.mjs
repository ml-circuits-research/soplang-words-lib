// Requests as worlds on capabilities alone (owner 2026-11-15: gap filling is one mechanism of every live world).
// Two invented example worlds declare what they can do (std.schema.honours, their kinds and slots, their own
// expectation facts in the k.expect shapes) and nothing else: the session below is the same for both and has no
// code per world. Words come from the published language world (w.lang.en cues), revisions from w.dialogue and
// defaults the worlds lack from k.expect, at the pinned commit.
//   node examples/request-app.mjs
import { World, readRequest, reviseRequest, planRequest, runPlan, sayRequest } from '../src/index.mjs';

// An example: shapes on a page. A picture is made of 4 to 8 shapes of two or three kinds, joined by links on request.
export const SKETCH = String.raw`
@acts core.use world=std.acts
@w std.schema.world name=sketch doc="an example world: shapes on a page"
@t.picture core.type of=picture extends=std.schema.thing closed=true
@s.layout core.slot of=picture key=layout enum=row enum=column enum=grid enum=ring enum=tree default=row
@s.extent core.slot of=picture key=extent kind=number min=0 max=1
@t.shape core.type of=shape extends=std.schema.thing closed=true
@s.size core.slot of=shape key=size kind=number min=0
@s.colour core.slot of=shape key=colour enum=red enum=blue enum=green enum=yellow
@s.in core.slot of=shape key=in
@t.circle core.type of=circle extends=shape closed=true
@t.square core.type of=square extends=shape closed=true
@t.triangle core.type of=triangle extends=shape closed=true
@k.picture std.schema.kind of=picture world=sketch acts=make acts=remove
@k.circle std.schema.kind of=circle world=sketch acts=make acts=remove acts=change acts=connect
@k.square std.schema.kind of=square world=sketch acts=make acts=remove acts=change acts=connect
@k.triangle std.schema.kind of=triangle world=sketch acts=make acts=remove acts=change acts=connect
@h.make std.schema.honours world=sketch act=make on=kind on=count on=size on=extent on=attribute on=layout on=manner on=with of=picture of=circle of=square of=triangle
@e.picture k.expect.make thing=picture made_in=diagram unit=shape min=4 max=8 typical=5 kinds_min=2 kinds_max=3 layout=row
@e.shape k.expect.part of=picture part=shape group=node min=4 max=8 typical=5 needed=yes shape=circle shape=square shape=triangle
@e.link k.expect.part of=picture part=link group=link min=0 max=7 typical=0
@w.sketch core.word text=sketch text=drawing means=picture
@w.link core.word text=arrow text=arrows text=link text=links text=lines means=link
`;

// An example: short notes. A note has a topic and a length in words, and is made of paragraphs.
export const NOTES = String.raw`
@acts core.use world=std.acts
@w std.schema.world name=notes doc="an example world: short notes made of paragraphs"
@t.note core.type of=note extends=std.schema.thing closed=true
@s.about core.slot of=note key=about kind=string
@s.length core.slot of=note key=length kind=integer min=1
@t.paragraph core.type of=paragraph extends=std.schema.thing closed=true
@s.in core.slot of=paragraph key=in
@k.note std.schema.kind of=note world=notes acts=make acts=remove
@k.paragraph std.schema.kind of=paragraph world=notes acts=make acts=remove
@h.make std.schema.honours world=notes act=make on=about on=length on=count on=size of=note
@e.note k.expect.make thing=note made_in=document unit=paragraph min=2 max=5 typical=3 length_unit=word length=120
@e.par k.expect.part of=note part=paragraph group=text min=2 max=5 typical=3 needed=yes
@w.write core.word text=write text=jot means=make
`;

/** A world from its text. */
export function exampleWorld(text) { const w = new World(); const r = w.load(text); if (!r.ok) throw new Error(JSON.stringify(r.violations?.[0] ?? r)); return w; }

/**
 * A session over any live world: read, revise, plan, run, say. `language`: a language world with w.lang.en cues and
 * replies; `catalog`: sources of k.expect and k.actions facts; `revisions`: w.dialogue.revision facts. The same code
 * for every world: what a world can do is what it declares.
 */
export function requestSession(live, { language, catalog = [], revisions = null } = {}) {
  const dialogue = { last: null, result: null, previous: null, seed: 1, lastRun: null };
  return {
    dialogue,
    say(text) {
      const request = readRequest(live, text, { language, catalog, dialogue });
      const rev = reviseRequest(dialogue, request, { revisions, catalog });
      if (rev.undo && !rev.request) return { request, revision: rev, plan: null, run: null, reply: sayRequest(request, { reply: 'nothing.undo' }, { language }) };
      if (!rev.request) return { request, revision: rev, plan: null, run: null, reply: sayRequest(request, { reply: rev.reply }, { language }) };
      const plan = planRequest(live, rev.request, { catalog, dialogue, seed: rev.seed, vary: rev.vary });
      const run = plan.ok ? runPlan(live, plan, { replace: (rev.replace || rev.undo) && dialogue.lastRun ? dialogue.lastRun.made : [] }) : null;
      if (run?.ok) {
        Object.assign(dialogue, rev.undo ? { previous: null } : { previous: dialogue.last, previousSeed: dialogue.seed, previousVary: dialogue.vary });
        Object.assign(dialogue, { last: rev.request, result: { ...run.result }, lastRun: run, seed: rev.seed, vary: !!rev.vary });
      }
      const reply = sayRequest(rev.request, { ...plan, run, revised: rev.sort === 'reaction' && !!run?.ok, reply: rev.reply }, { language });
      return { request: rev.request, revision: rev, plan, run, reply };
    },
  };
}

/**
 * The published words a session needs, in one World: w.lang.en cues, closed words, number words, inflection and
 * replies; k.actions verbs; k.expect amounts, scale and makes; w.dialogue revisions; k.colours names. Null offline.
 */
export async function requestLanguage() {
  const { catalogWorld, worldsDir } = await import('../tools/worlds.mjs');
  if (!worldsDir()) return null;
  const en = ['cue', 'det', 'prep', 'pron', 'skip', 'number', 'inflect', 'irregular', 'reply', 'count', 'onset', 'anaphor'].map((t) => `w.lang.en.${t}`);
  return catalogWorld({ 'w.lang.en': en, 'k.actions': ['k.actions.verb'], 'k.expect': ['k.expect.amount', 'k.expect.scale', 'k.expect.make', 'k.expect.part'], 'w.dialogue': ['w.dialogue.revision'], 'k.colours': ['k.colours.basic', 'k.colours.colour'] });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const language = await requestLanguage();
  if (!language) { console.log('the published worlds cannot be read here'); process.exit(0); }
  for (const [name, text, turns] of [['sketch', SKETCH, ['draw a sketch, not circles', 'too many', 'not all squares, with arrows', 'draw 3 small red circles in the top left', 'blorp a picture']], ['notes', NOTES, ['write a short note about bees', 'write a note about frogs in red']]]) {
    const s = requestSession(exampleWorld(text), { language, catalog: [language], revisions: language });
    console.log(`-- ${name}`);
    for (const t of turns) { const r = s.say(t); console.log(`> ${t}\n  ${r.reply.text}`); }
  }
}
