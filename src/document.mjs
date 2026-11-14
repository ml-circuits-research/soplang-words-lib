// A composition written as a w.document live world (the knowledge repository's world schema for
// written documents): chapters or slides by the genre's unit, a paragraph per chapter, sentences
// with their move and the ids of the wires they state. Written through the acts of std.acts, so
// the schema's checks and denies hold; read back in order by readDocument (for summaries).

const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/^\$/, '');

/**
 * Writes `composition` (compose's result with a genre) into `world`, which uses `w.document`.
 * Options: `title` (default the topic), `language`, `realise(frame, register) -> text` (a frame's
 * own `text` first; with neither, a language-free placeholder `[move] facts`), `slides` (default:
 * when the genre's unit is slide; else chapters), `facts(frame) -> [wire ids]` (default: the cited
 * wire, else a wire named as the story element's value). Returns { document, made, refused }.
 */
export function writeDocument(world, composition, { title, language, realise, slides, facts } = {}) {
  if (!composition?.parts) return { why: 'not a composition by a genre (no parts)' };
  const refused = [], made = [];
  const act = (kind, args) => {
    const clean = Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && !v.length)));
    const r = world.act({ action: 'make', args: { kind, ...clean } });
    if (!r.ok) { refused.push({ kind, args: clean, why: r.violations?.[0]?.why ?? r.status }); return null; }
    made.push(r.result.thing);
    return r.result.thing;
  };
  const g = world.ofType('k.genres.genre').find((x) => bare(x.attrs.name[0]) === composition.genre);
  const asSlides = slides ?? (g ? bare(g.attrs.unit?.[0] ?? '') === 'slide' : composition.genre === 'presentation');
  const named = (v) => [...world.wires.values()].find((w) => !w.type.startsWith('core.') && !w.type.startsWith('w.document') && (w.attrs.name || []).some((n) => bare(n) === v))?.id;
  const factsOf = facts ?? ((f) => (f.cites ? [f.cites] : f.recalls ? [f.recalls] : f.value ? [named(f.value)].filter(Boolean) : []));
  const doc = act('w.document.document', { title: title ?? composition.topic, genre: composition.genre, topic: composition.topic, register: composition.register?.name, language, seed: composition.seed });
  if (!doc) return { refused, made };
  composition.parts.forEach((p, i) => { // bounded: the parts of the composition
    const at = asSlides
      ? { slide: act('w.document.slide', { document: `$${doc}`, n: i + 1, title: p.heading, layout: p.layout, part: p.part }) }
      : (() => { const ch = act('w.document.chapter', { document: `$${doc}`, n: i + 1, title: p.heading, part: p.part }); return { paragraph: ch && act('w.document.paragraph', { chapter: `$${ch}`, n: 1 }) }; })();
    const parent = at.slide ? { slide: `$${at.slide}` } : at.paragraph ? { paragraph: `$${at.paragraph}` } : null;
    if (!parent) return;
    p.moves.forEach((f, k) => { // bounded: the sentences of a part
      const text = f.text ?? realise?.(f, composition.register) ?? `[${f.move}] ${[f.cites, f.recalls, f.value, ...(f.outline || [])].filter(Boolean).join(' ') || composition.topic}`;
      act('w.document.sentence', { ...parent, n: k + 1, text, move: f.move, template: f.template, fact: factsOf(f) });
    });
  });
  return { document: doc, made, refused };
}

/** A document read back in order: { title, genre, parts: [{ part, title, sentences: [{ text, move, facts }] }] }. */
export function readDocument(world, id) {
  const d = world.get(id);
  if (!d) return { why: `there is no document ${id}` };
  const of = (t, key, parent) => world.ofType(t).filter((w) => bare(w.attrs[key]?.[0] ?? '') === parent).sort((a, b) => Number(bare(a.attrs.n?.[0] ?? 0)) - Number(bare(b.attrs.n?.[0] ?? 0)));
  const sentences = (key, parent) => of('w.document.sentence', key, parent).map((s) => ({ text: bare(s.attrs.text[0]), move: s.attrs.move ? bare(s.attrs.move[0]) : undefined, facts: (s.attrs.fact || []).map(bare) }));
  const parts = [
    ...of('w.document.slide', 'document', id).map((s) => ({ part: s.attrs.part && bare(s.attrs.part[0]), title: s.attrs.title && bare(s.attrs.title[0]), sentences: sentences('slide', s.id) })),
    ...of('w.document.chapter', 'document', id).map((c) => ({ part: c.attrs.part && bare(c.attrs.part[0]), title: c.attrs.title && bare(c.attrs.title[0]),
      sentences: [...of('w.document.paragraph', 'chapter', c.id), ...of('w.document.section', 'chapter', c.id).flatMap((s) => of('w.document.paragraph', 'section', s.id))].flatMap((p) => sentences('paragraph', p.id)) })),
  ];
  return { title: bare(d.attrs.title[0]), genre: d.attrs.genre && bare(d.attrs.genre[0]), parts };
}
