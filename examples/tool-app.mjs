// A live world with a tool, declared only by wires (owner 2026-11-15 19:27): the library reads the request, plans it,
// binds each step to a tool primitive, translates values by knowledge, checks preconditions, runs it, keeps the
// timeline and says what changed. The world below is invented (books on a shelf); its code is three primitives and the
// view, none of which reads the request, holds a word or a default.
//   node examples/tool-app.mjs
import { World, toolSession } from '../src/index.mjs';

// An example: books on a shelf. The tool takes two sizes and two ends; the request may say any grade of k.expect.scale.
export const SHELF = String.raw`
@acts core.use world=std.acts
@tool core.use world=std.tool
@w std.schema.world name=shelf doc="an example world: books on a shelf, put there by a tool"
@t.book core.type of=book extends=std.schema.thing closed=true
@s.size core.slot of=book key=size enum=tiny enum=small enum=default enum=big enum=huge
@s.colour core.slot of=book key=colour enum=red enum=blue enum=green enum=black
@s.end core.slot of=book key=end enum=left enum=right
@t.novel core.type of=novel extends=book closed=true
@t.atlas core.type of=atlas extends=book closed=true
@t.comic core.type of=comic extends=book closed=true
@k.novel std.schema.kind of=novel world=shelf acts=make acts=remove acts=change
@k.atlas std.schema.kind of=atlas world=shelf acts=make acts=remove acts=change
@k.comic std.schema.kind of=comic world=shelf acts=make acts=remove acts=change
@h.make std.schema.honours world=shelf act=make on=kind on=count on=size on=attribute of=book of=novel of=atlas of=comic
@h.remove std.schema.honours world=shelf act=remove on=kind on=count on=attribute of=book
@h.change std.schema.honours world=shelf act=change on=kind on=attribute on=size of=book
@h.place std.schema.honours world=shelf act=place on=kind on=place of=book
@x.atlas k.expect.value of=atlas on=size value=big about="an atlas is a big book"
@x.small k.expect.value of=book on=size value=small about="a book is small unless said"
@x.right k.expect.value of=book on=end value=right when.size=big when.size=huge about="a big book stands at the right end"
@x.left k.expect.value of=book on=end value=left about="the others at the left end"
@x.some k.expect.value of=book on=count min=2 max=4 typical=3 when.plural=yes about="books said with no number are three"
@op.add std.tool.op name=add world=shelf param=kind param=n param=size param=colour param=end effect=makes
@pa.kind std.tool.param op=add name=kind type=book required=true
@pa.n std.tool.param op=add name=n kind=integer min=1 max=12 default=1
@pa.size std.tool.param op=add name=size type=k.expect.scale accepts=small accepts=big
@pa.end std.tool.param op=add name=end accepts=left accepts=right
@op.remove std.tool.op name=remove world=shelf param=ids effect=removes
@op.paint std.tool.op name=paint world=shelf param=ids param=colour param=size effect=changes
@pp.size std.tool.param op=paint name=size type=k.expect.scale accepts=small accepts=big
@b.make std.tool.bind world=shelf act=make of=book op=add
@a.kind std.tool.arg bind=$b.make param=kind from=step.kind
@a.n std.tool.arg bind=$b.make param=n from=step.count
@a.size std.tool.arg bind=$b.make param=size from=step.size
@a.colour std.tool.arg bind=$b.make param=colour from=step.colour
@a.end std.tool.arg bind=$b.make param=end from=step.end
@b.remove std.tool.bind world=shelf act=remove of=book op=remove arg=ids<-step.things needs=exists(ids) removes=ids
@op.move std.tool.op name=move world=shelf param=ids param=end effect=changes
@b.place std.tool.bind world=shelf act=place of=book op=move arg=ids<-step.things arg=end<-step.place needs=exists(ids) changes=end
@b.change std.tool.bind world=shelf act=change of=book op=paint arg=ids<-step.things arg=colour<-step.colour arg=size<-step.size needs=exists(ids) changes=colour changes=size
`;

/** The tool: four primitives and its state as facts. No request, no words, no defaults. */
export function shelfTool() {
  let books = [], next = 1;
  return {
    add({ kind, n, size, colour, end }) { for (let i = 0; i < n; i++) books.push({ id: `b${next++}`, kind, size, colour, end }); },
    move({ ids, end }) { const moved = books.filter((b) => ids.includes(b.id)); books = books.filter((b) => !ids.includes(b.id)); for (const b of moved) b.end = end; books = end === 'left' ? [...moved, ...books] : [...books, ...moved]; },
    remove({ ids }) { books = books.filter((b) => !ids.includes(b.id)); },
    paint({ ids, colour, size }) { for (const b of books) if (ids.includes(b.id)) { if (colour) b.colour = colour; if (size) b.size = size; } },
    view: () => books.map((b, i) => ({ ...b, at: i + 1 })), // `at`: where the book stands, computed by the tool (no request sets it)
  };
}

// A second example, to show nothing above is about shelves: beads threaded on a necklace, tied one to the next. A whole
// with parts and links; the first bead (the one nothing is tied to) is the clasp, gold unless said.
export const NECKLACE = String.raw`
@acts core.use world=std.acts
@tool core.use world=std.tool
@w std.schema.world name=beads doc="an example world: beads threaded on a necklace by a tool"
@t.necklace core.type of=necklace extends=std.schema.thing closed=true
@t.bead core.type of=bead extends=std.schema.thing closed=true
@s.in core.slot of=bead key=in type=necklace
@s.colour core.slot of=bead key=colour enum=gold enum=red enum=blue enum=white
@t.round core.type of=round extends=bead closed=true
@t.square core.type of=square extends=bead closed=true
@k.necklace std.schema.kind of=necklace world=beads acts=make acts=remove
@k.round std.schema.kind of=round world=beads acts=make acts=remove acts=connect
@k.square std.schema.kind of=square world=beads acts=make acts=remove acts=connect
@h.make std.schema.honours world=beads act=make on=kind on=count on=attribute of=necklace
@e.necklace k.expect.make thing=necklace unit=bead min=4 max=8 typical=6 kinds_min=2 kinds_max=2
@e.bead k.expect.part of=necklace part=bead group=node min=4 max=8 typical=6 shape=round shape=square
@e.tie k.expect.part of=necklace part=tie group=link min=0 max=7 typical=5
@x.clasp k.expect.value of=bead on=colour value=gold when.role=start about="the first bead is the clasp"
@x.white k.expect.value of=bead on=colour value=white about="the other beads are white"
@op.string std.tool.op name=string world=beads param=kind effect=makes
@op.bead std.tool.op name=bead world=beads param=kind param=on param=colour effect=makes
@pb.kind std.tool.param op=bead name=kind type=kind accepts=round accepts=square required=yes
@op.tie std.tool.op name=tie world=beads param=kind param=a param=b effect=makes
@op.cut std.tool.op name=cut world=beads param=ids effect=removes
@b.necklace std.tool.bind act=make of=necklace op=string arg=kind<-step.kind makes=thing
@b.bead std.tool.bind act=make of=bead op=bead arg=kind<-step.kind arg=on<-step.in|state.necklace arg=colour<-step.colour makes=thing
@n.bead std.tool.needs op=bead exists=necklace
@b.tie std.tool.bind act=connect op=tie arg=kind<-value.tie arg=a<-step.a arg=b<-step.b needs=exists(a) needs=exists(b) makes=thing
@b.cut std.tool.bind act=remove op=cut arg=ids<-step.things needs=exists(ids) removes=ids
`;

/** The necklace tool: four primitives and its state as facts (the kinds come in as arguments, from the wires). */
export function necklaceTool() {
  let things = [], next = 1;
  const id = (p) => `${p}${next++}`;
  return {
    string({ kind }) { things.push({ id: id('n'), kind }); },
    bead({ kind, on, colour }) { things.push({ id: id('b'), kind, in: on, colour }); },
    tie({ kind, a, b }) { things.push({ id: id('t'), kind, a, b }); },
    cut({ ids }) { things = things.filter((t) => !ids.includes(t.id)); },
    view: () => things.map((t) => ({ ...t })),
  };
}

// A third example: one puppet face, a whole with slots of parts. Its kinds come from a small catalog by join: every slot
// is a kind of part (as=part: they take the part's slots), every preset a kind of the face (as=face); each part is worn
// in a variant of its slot (a slot typed by the catalog's variants, matched by the part's kind), the face has a mood (a
// value of a whole-level key). FACE_BASE stands for the knowledge base the world joins.
export const FACE_BASE = String.raw`
@t.slot core.type of=k.demo.slot
@t.variant core.type of=k.demo.variant
@t.variant.slot core.slot of=k.demo.variant key=slot type=k.demo.slot by=name
@t.preset core.type of=k.demo.preset
@t.mood core.type of=k.demo.mood
@sl.mouth k.demo.slot name=mouth
@sl.eyes k.demo.slot name=eyes
@sl.nose k.demo.slot name=nose
@sl.hat k.demo.slot name=hat optional=true
@sl.glasses k.demo.slot name=glasses optional=true
@va.smile k.demo.variant slot=mouth name=smile order=1
@va.grin k.demo.variant slot=mouth name=grin order=2
@va.pout k.demo.variant slot=mouth name=pout order=3
@va.round k.demo.variant slot=eyes name=round order=1
@va.sleepy k.demo.variant slot=eyes name=sleepy order=2
@va.button k.demo.variant slot=nose name=button order=1
@va.cap k.demo.variant slot=hat name=cap order=1
@va.crown k.demo.variant slot=hat name=crown order=2
@va.specs k.demo.variant slot=glasses name=specs order=1
@pr.boy k.demo.preset name=boy
@pr.robot k.demo.preset name=robot
@pr.old k.demo.preset name=old_woman
@mo.calm k.demo.mood name=calm
@mo.happy k.demo.mood name=happy
@mo.angry k.demo.mood name=angry
@mo.sad k.demo.mood name=sad`;

export const FACE = String.raw`
@acts core.use world=std.acts
@tool core.use world=std.tool
@w std.schema.world name=puppet doc="an example world: one puppet face; its parts are the slots of a catalog, each worn in a variant"
@t.face core.type of=face extends=std.schema.thing closed=true
@s.face.mood core.slot of=face key=mood type=k.demo.mood by=name default=calm
@k.face std.schema.kind of=face world=puppet acts=change
@j.preset std.schema.kinds world=puppet from=k.demo.preset key=name acts=make as=face
@t.part core.type of=part extends=std.schema.thing closed=true
@s.part.colour core.slot of=part key=colour enum=red enum=blue enum=green enum=black
@s.part.size core.slot of=part key=size type=k.expect.scale by=step default=default
@s.part.variant core.slot of=part key=variant type=k.demo.variant by=name match=kind:slot
@j.part std.schema.kinds world=puppet from=k.demo.slot key=name acts=make acts=remove acts=change as=part
@h.make std.schema.honours world=puppet act=make on=kind on=attribute on=size
@h.change std.schema.honours world=puppet act=change on=kind on=attribute on=size
@h.remove std.schema.honours world=puppet act=remove on=kind
@op.wear std.tool.op name=wear world=puppet param=preset param=mood effect=changes
@b.wear std.tool.bind world=puppet act=make of=k.demo.preset op=wear arg=preset<-step.kind arg=mood<-step.mood
@op.put std.tool.op name=put world=puppet param=part param=variant param=colour param=size effect=changes
@b.put std.tool.bind world=puppet act=make of=k.demo.slot op=put arg=part<-step.kind arg=variant<-step.variant arg=colour<-step.colour arg=size<-step.size
@op.off std.tool.op name=off world=puppet param=ids effect=removes
@b.off std.tool.bind world=puppet act=remove op=off arg=ids<-step.things needs=exists(ids) removes=ids
@op.set std.tool.op name=set world=puppet param=ids param=colour param=size param=variant param=mood effect=changes
@b.set std.tool.bind world=puppet act=change op=set arg=ids<-step.things arg=colour<-step.colour arg=size<-step.size arg=variant<-step.variant arg=mood<-step.mood needs=exists(ids)
`;

/** The face tool: four primitives (a preset worn, a part put on, parts taken off, values set) and its state as facts. */
export function faceTool() {
  let face = { id: 'face', kind: 'face', mood: 'calm' }, parts = [
    { id: 'mouth', kind: 'mouth', variant: 'smile', size: 'default' },
    { id: 'eyes', kind: 'eyes', variant: 'round', size: 'default' },
    { id: 'nose', kind: 'nose', variant: 'button', size: 'default' }];
  return {
    wear({ preset, mood }) { face = { ...face, kind: preset }; if (mood) face.mood = mood; },
    put({ part, variant, colour, size }) { const p = parts.find((x) => x.kind === part); if (p) { if (variant) p.variant = variant; if (colour) p.colour = colour; if (size) p.size = size; } else parts.push({ id: part, kind: part, variant: variant ?? null, size: size ?? 'default', ...(colour ? { colour } : {}) }); },
    off({ ids }) { parts = parts.filter((p) => !ids.includes(p.id)); },
    set({ ids, colour, size, variant, mood }) { for (const t of [face, ...parts]) if (ids.includes(t.id)) { if (colour) t.colour = colour; if (size) t.size = size; if (variant) t.variant = variant; if (mood) t.mood = mood; } },
    view: () => [{ ...face }, ...parts.map((p) => ({ ...p }))],
  };
}

/** A world from its text. */
export function exampleWorld(text) { const w = new World(); const r = w.load(text); if (!r.ok) throw new Error(JSON.stringify(r.violations?.[0] ?? r)); return w; }
/** The catalog rows the face world joins, as a world. */
export const faceBase = () => exampleWorld(FACE_BASE);

/**
 * Proposed for w.lang.en (not yet published, questions.md Q87): the cue of a question about what a world can do, and
 * its reply. Told into the language world the example reads, so the session can answer it.
 */
export const PROPOSED_EN = String.raw`
@w.lang.en.cue.ask.capabilities w.lang.en.cue name=ask.capabilities on=reaction value=capabilities lead="what can you do" lead="what can i do here" lead="what do you do" lead="help" takes=none priority=4
@w.lang.en.cue.ask.state w.lang.en.cue name=ask.state on=reaction value=state lead="how many" lead="what is" lead="what's" lead="what is there" lead="what do you have" takes=none priority=3
@w.lang.en.reply.can.one w.lang.en.reply name=can count=one role=act role=kinds text="I can {act}: {kinds}."
@w.lang.en.reply.can.say.one w.lang.en.reply name=can.say count=one role=act role=keys text="When I {act}, you can say the {keys}."
@w.lang.en.reply.state.count.one w.lang.en.reply name=state.count count=one role=kind role=number text="There is one {kind}."
@w.lang.en.reply.state.count.other w.lang.en.reply name=state.count count=other role=kind role=number text="There are {number} {kind:num=pl}."
@w.lang.en.reply.state.count.value.one w.lang.en.reply name=state.count.value count=one role=kind role=number role=value text="There is a {value} {kind}."
@w.lang.en.reply.state.count.value.other w.lang.en.reply name=state.count.value count=other role=kind role=number role=value text="There are {number} {value} {kind:num=pl}."
@w.lang.en.reply.done.add.value.one w.lang.en.reply name=done.add.value count=one role=kind role=value text="I added a {value} {kind}."
@w.lang.en.reply.done.add.value.other w.lang.en.reply name=done.add.value count=other role=kind role=number role=value text="I added {number} {value} {kind:num=pl}."
@w.lang.en.reply.state.empty.one w.lang.en.reply name=state.empty count=one text="There is nothing here yet."
@w.lang.en.reply.nothing.same.one w.lang.en.reply name=nothing.same count=one text="That is what is there already."
@w.lang.en.reply.done.change.place.one w.lang.en.reply name=done.change.place count=one role=thing role=value text="I moved the {thing} to the {value}."
@w.lang.en.reply.done.change.place.other w.lang.en.reply name=done.change.place count=other role=thing role=number role=value text="I moved {number} {thing:num=pl} to the {value}."
@w.lang.en.reply.done.place.into.one w.lang.en.reply name=done.place.into count=one role=thing role=value text="I moved the {thing} into the {value}."
@w.lang.en.reply.done.place.into.other w.lang.en.reply name=done.place.into count=other role=thing role=number role=value text="I moved {number} {thing:num=pl} into the {value}."
@w.lang.en.reply.done.change.size.one w.lang.en.reply name=done.change.size count=one role=thing role=value text="The {thing} is {value} now."
@w.lang.en.reply.done.change.size.other w.lang.en.reply name=done.change.size count=other role=thing role=number role=value text="I made {number} {thing:num=pl} {value}."
@w.lang.en.cue.step.next w.lang.en.cue name=step.next on=attribute step=up lead=next takes=thing priority=3
@w.lang.en.cue.step.previous w.lang.en.cue name=step.previous on=attribute step=down lead=previous takes=thing priority=3
@w.lang.en.reply.refused.can_be.one w.lang.en.reply name=refused.can_be count=one role=thing role=value role=kinds text="The {thing} cannot be {value}; it can be {kinds}."
@w.lang.en.irregular.eyes w.lang.en.irregular singular=eyes plural=eyes
@w.lang.en.irregular.glasses w.lang.en.irregular singular=glasses plural=glasses
`;

/** The published words a tool session needs, with the proposed ones; null offline. */
export async function toolLanguage() {
  const { requestLanguage } = await import('./request-app.mjs');
  const language = await requestLanguage();
  if (!language) return null;
  language.tell(PROPOSED_EN);
  return language;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const language = await toolLanguage();
  if (!language) { console.log('the published worlds cannot be read here'); process.exit(0); }
  const tool = shelfTool();
  const s = toolSession(exampleWorld(SHELF), tool, { language, catalog: [language] });
  for (const t of ['add 3 tiny red novels', 'add 4 books, not comics', 'too many', 'undo', 'what can you do here?', 'add 2 huge atlases', 'add two novels and a comic', 'how many novels?', 'what is on the shelf?', 'in red', 'paint the comic blue', 'remove the atlases', 'remove the novel', 'add 2 dictionaries']) {
    const r = s.say(t);
    console.log(`> ${t}\n  ${r.reply.text}\n  shelf: ${tool.view().map((b) => `${b.kind}/${b.size}/${b.end}${b.colour ? '/' + b.colour : ''}`).join(' ')}`);
  }
  const beads = necklaceTool();
  const n = toolSession(exampleWorld(NECKLACE), beads, { language, catalog: [language] });
  for (const t of ['make a necklace', 'too many', 'more', 'undo', 'what is there?']) {
    const r = n.say(t);
    console.log(`> ${t}\n  ${r.reply.text}\n  beads: ${beads.view().filter((b) => b.kind !== 'tie').map((b) => b.kind + (b.colour ? '/' + b.colour : '')).join(' ')}; ties ${beads.view().filter((b) => b.kind === 'tie').length}`);
  }  const face = faceTool();
  const f = toolSession(exampleWorld(FACE), face, { language, catalog: [language, faceBase()] });
  for (const t of ['make it happy', 'make an angry boy', 'make the puppet an emoji', 'put a hat', 'give her a crown', 'take off the hat', 'a big smile', 'the next mouth', 'make the eyes big', 'reset the face']) console.log(`> ${t}\n  ${f.say(t).reply.text}`);

}
