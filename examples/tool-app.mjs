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
@h.change std.schema.honours world=shelf act=change on=kind on=attribute of=book
@x.atlas k.expect.value of=atlas on=size value=big about="an atlas is a big book"
@x.small k.expect.value of=book on=size value=small about="a book is small unless said"
@x.right k.expect.value of=book on=end value=right when.size=big when.size=huge about="a big book stands at the right end"
@x.left k.expect.value of=book on=end value=left about="the others at the left end"
@op.add std.tool.op name=add world=shelf param=kind param=n param=size param=colour param=end effect=makes
@pa.kind std.tool.param op=add name=kind type=book required=true
@pa.n std.tool.param op=add name=n kind=integer min=1 max=12 default=1
@pa.size std.tool.param op=add name=size type=k.expect.scale accepts=small accepts=big
@pa.end std.tool.param op=add name=end accepts=left accepts=right
@op.remove std.tool.op name=remove world=shelf param=ids effect=removes
@op.paint std.tool.op name=paint world=shelf param=ids param=colour effect=changes
@b.make std.tool.bind world=shelf act=make of=book op=add
@a.kind std.tool.arg bind=$b.make param=kind from=step.kind
@a.n std.tool.arg bind=$b.make param=n from=step.count
@a.size std.tool.arg bind=$b.make param=size from=step.size
@a.colour std.tool.arg bind=$b.make param=colour from=step.colour
@a.end std.tool.arg bind=$b.make param=end from=step.end
@b.remove std.tool.bind world=shelf act=remove of=book op=remove arg=ids<-step.things needs=exists(ids) removes=ids
@b.change std.tool.bind world=shelf act=change of=book op=paint arg=ids<-step.things arg=colour<-step.colour needs=exists(ids) changes=colour
`;

/** The tool: three primitives and its state as facts. No request, no words, no defaults. */
export function shelfTool() {
  let books = [], next = 1;
  return {
    add({ kind, n, size, colour, end }) { for (let i = 0; i < n; i++) books.push({ id: `b${next++}`, kind, size, colour, end }); },
    remove({ ids }) { books = books.filter((b) => !ids.includes(b.id)); },
    paint({ ids, colour }) { for (const b of books) if (ids.includes(b.id)) b.colour = colour; },
    view: () => books.map((b) => ({ ...b })),
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

/** A world from its text. */
export function exampleWorld(text) { const w = new World(); const r = w.load(text); if (!r.ok) throw new Error(JSON.stringify(r.violations?.[0] ?? r)); return w; }

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
@w.lang.en.reply.state.empty.one w.lang.en.reply name=state.empty count=one text="There is nothing here yet."
@w.lang.en.reply.nothing.same.one w.lang.en.reply name=nothing.same count=one text="That is what is there already."
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
  }
}
