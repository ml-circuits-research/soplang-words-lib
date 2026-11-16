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
@h.remove std.schema.honours world=sketch act=remove on=kind on=count on=attribute of=picture of=shape
@h.change std.schema.honours world=sketch act=change on=kind on=attribute of=shape
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

// An example: stories and a mixed garden of text and scenery. A story has a topic (`about`), a length in words and is
// made of chapters (its parts); a story is one whole, its chapters are many. The knowledge says a story has 3 to 8
// chapters and at most so many words per chapter, so a long request can come out short.
export const STORIES = String.raw`
@acts core.use world=std.acts
@w std.schema.world name=stories doc="an example world: stories made of chapters"
@t.story core.type of=story extends=std.schema.thing closed=true
@s.about core.slot of=story key=about kind=string
@s.length core.slot of=story key=length kind=integer min=1
@t.chapter core.type of=chapter extends=std.schema.thing closed=true
@s.in core.slot of=chapter key=in
@k.story std.schema.kind of=story world=stories acts=make acts=remove
@k.chapter std.schema.kind of=chapter world=stories acts=make acts=remove
@h.make std.schema.honours world=stories act=make on=about on=length on=count on=size on=with of=story of=chapter
@e.story k.expect.make thing=story unit=chapter length_unit=word length=60 min=3 max=8 typical=4
@e.chap k.expect.part of=story part=chapter group=text min=3 max=8 typical=4 needed=yes
@w.write core.word text=write text=tell means=make
@w.tale core.word text=story text=tale means=story
`;

// An example knowledge base of genres (the shape of the published `k.genres`): two genres whose parts differ. A letter is a
// greeting, a body of one to three paragraphs and a closing; a report is three to eight chapters. Joined to a world of texts
// (`std.schema.kinds from=k.demo.genre as=<type>`), each is planned with its own parts, by name.
export const GENRES = String.raw`
@t.genre core.type of=k.demo.genre
@g.letter k.demo.genre name=letter
@g.report k.demo.genre name=report
@p.l1 k.genres.part genre=letter name=greeting n=1 min=1 max=1
@p.l2 k.genres.part genre=letter name=body n=2 min=1 max=3
@p.l3 k.genres.part genre=letter name=closing n=3 min=1 max=1
@s.l1 k.genres.step genre=letter part=greeting n=1 move=greet min=1 max=1
@s.l2 k.genres.step genre=letter part=body n=1 move=generalise min=1 max=2
@s.l3 k.genres.step genre=letter part=closing n=1 move="sign off" min=1 max=1
@p.r1 k.genres.part genre=report name=chapter n=1 min=3 max=8
@s.r1 k.genres.step genre=report part=chapter n=1 move=tell min=1 max=2
`;

// An example: a meadow, one whole of several kinds of parts (flowers, a tree, a bird), each part with its own range. A
// count said of one kind ("fewer flowers", "a meadow with a pond") is that kind's count inside the whole, not the whole's.
export const MEADOW = String.raw`
@acts core.use world=std.acts
@w std.schema.world name=meadow doc="an example world: meadows of flowers, trees, birds and ponds"
@t.meadow core.type of=meadow extends=std.schema.thing closed=true
@t.item core.type of=item extends=std.schema.thing closed=true
@s.in core.slot of=item key=in type=meadow
@t.flower core.type of=flower extends=item closed=true
@t.tree core.type of=tree extends=item closed=true
@t.bird core.type of=bird extends=item closed=true
@t.pond core.type of=pond extends=item closed=true
@k.meadow std.schema.kind of=meadow world=meadow acts=make acts=remove
@k.flower std.schema.kind of=flower world=meadow acts=make acts=remove
@k.tree std.schema.kind of=tree world=meadow acts=make acts=remove
@k.bird std.schema.kind of=bird world=meadow acts=make acts=remove
@k.pond std.schema.kind of=pond world=meadow acts=make acts=remove
@h.make std.schema.honours world=meadow act=make on=kind on=count on=with on=size of=meadow of=flower of=tree of=bird of=pond
@e.meadow k.expect.make thing=meadow unit=item min=6 max=14 typical=9
@p.flower k.expect.part of=meadow part=flower group=plant min=3 max=8 typical=5 needed=yes
@p.tree k.expect.part of=meadow part=tree group=plant min=1 max=3 typical=2 needed=yes
@p.bird k.expect.part of=meadow part=bird group=animal min=0 max=2 typical=1
@p.pond k.expect.part of=meadow part=pond group=water min=0 max=2 typical=2
`;

// An example: animals put in the areas of a garden. A pond has room for so many fish; where an animal goes is not
// declared anywhere: the planner tries the areas there are and keeps the one the catalog's kind facts expect.
export const GARDEN = String.raw`
@acts core.use world=std.acts
@w std.schema.world name=garden doc="an example world: animals placed in the areas of a garden"
@t.area core.type of=area extends=std.schema.thing closed=true
@s.room core.slot of=area key=room kind=integer min=0
@t.pond core.type of=pond extends=area closed=true
@t.grass core.type of=grass extends=area closed=true
@t.tree core.type of=tree extends=area closed=true
@t.animal core.type of=animal extends=std.schema.thing closed=true
@s.in core.slot of=animal key=in type=area
@s.colour core.slot of=animal key=colour enum=grey enum=gold enum=brown enum=white
@t.fish core.type of=fish extends=animal closed=true
@t.bird core.type of=bird extends=animal closed=true
@k.pond std.schema.kind of=pond world=garden acts=remove
@k.grass std.schema.kind of=grass world=garden acts=remove
@k.tree std.schema.kind of=tree world=garden acts=remove
@k.fish std.schema.kind of=fish world=garden acts=make acts=remove
@k.bird std.schema.kind of=bird world=garden acts=make acts=remove
@cap std.schema.capacity of=pond key=room holds=fish via=in
@h.make std.schema.honours world=garden act=make on=kind on=count on=attribute on=place of=fish of=bird
@grass1 grass kind=grass world=garden
@pond1 pond kind=pond world=garden room=1
@tree1 tree kind=tree world=garden
@pond2 pond kind=pond world=garden room=4
`;

/** A world from its text. */
export function exampleWorld(text) { const w = new World(); const r = w.load(text); if (!r.ok) throw new Error(JSON.stringify(r.violations?.[0] ?? r)); return w; }

/**
 * A session over any live world: read, revise, plan, run, say. `language`: a language world with w.lang.en cues and
 * replies; `catalog`: sources of k.expect and k.actions facts; `revisions`: w.dialogue.revision facts. The same code
 * for every world: what a world can do is what it declares.
 */
export function requestSession(live, { language, catalog = [], revisions = null } = {}) {
  const dialogue = { last: null, result: null, previous: null, seed: 1, lastRun: null, corrections: [] };
  return {
    dialogue,
    say(text) {
      const request = readRequest(live, text, { language, catalog, dialogue });
      const rev = reviseRequest(dialogue, request, { revisions, catalog, live });
      if (rev.undo && !rev.request) return { request, revision: rev, plan: null, run: null, reply: sayRequest(request, { reply: 'nothing.undo' }, { language }) };
      if (!rev.request) return { request, revision: rev, plan: null, run: null, reply: sayRequest(request, { reply: rev.reply }, { language }) };
      const replace = (rev.replace || rev.undo) && dialogue.lastRun ? dialogue.lastRun.made : [];
      const plan = planRequest(live, rev.request, { catalog, dialogue, seed: rev.seed, vary: rev.vary, replace });
      const run = plan.ok ? runPlan(live, plan, { replace, catalog }) : null;
      if (run?.ok) {
        const step = rev.does?.find((d) => d.does === 'step'); // a correction ("too many", "bigger"), for induction over the session
        if (step) dialogue.corrections.push({ on: step.on, step: step.direction });
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
  const en = ['cue', 'det', 'prep', 'pron', 'skip', 'wh', 'number', 'inflect', 'irregular', 'reply', 'count', 'onset', 'anaphor', 'rule', 'construction', 'word'].map((t) => `w.lang.en.${t}`);
  return catalogWorld({ 'w.lang.en': en, 'k.actions': ['k.actions.verb'], 'k.expect': ['k.expect.amount', 'k.expect.scale', 'k.expect.make', 'k.expect.part'], 'w.dialogue': ['w.dialogue.revision'], 'k.colours': ['k.colours.basic', 'k.colours.colour'] });
}

/** What the catalog says of kinds (k.commonsense, k.scenes, k.kinds parents), for the deduction of the planner. Null offline. */
export async function requestKinds() {
  const { catalogWorld, worldsDir } = await import('../tools/worlds.mjs');
  if (!worldsDir()) return null;
  return catalogWorld({ 'k.commonsense': ['k.commonsense.thing'], 'k.scenes': ['k.scenes.thing'], 'k.kinds': ['k.kinds.parent'] });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const language = await requestLanguage();
  if (!language) { console.log('the published worlds cannot be read here'); process.exit(0); }
  const kinds = await requestKinds();
  for (const [name, text, turns] of [['sketch', SKETCH, ['draw a sketch, not circles', 'too many', 'not all squares, with arrows', 'draw 3 small red circles in the top left', 'blorp a picture']], ['notes', NOTES, ['write a short note about bees', 'write a note about frogs in red']], ['garden', GARDEN, ['add a fish', 'add a bird', 'add 2 fish there', 'add 9 fish in the pond']]]) {
    const s = requestSession(exampleWorld(text), { language, catalog: [language, kinds], revisions: language });
    console.log(`-- ${name}`);
    for (const t of turns) { const r = s.say(t); console.log(`> ${t}\n  ${r.reply.text}`); }
  }
}
