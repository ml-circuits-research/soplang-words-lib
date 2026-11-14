// std.compose (reviewer 14:45 B, 15:00, 17:10): a composition of a genre about a topic. The interest
// model is the published k.interest, read at the pinned commit; the catalog is a toy, invented here
// (birds that fly and one that does not, animal weights, a derived fact). The order k.interest's own
// integration case asks for must come out: the exception > the far number > the obvious.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, compose, interestOf } from '../tools/lib-under-test.mjs';
import { worldText, worldsDir } from '../tools/worlds.mjs';

const CATALOG = `@robin k.animal name=robin kind=bird fly=yes  @crow k.animal name=crow kind=bird fly=yes
@gull k.animal name=gull kind=bird fly=yes  @owl k.animal name=owl kind=bird fly=yes lives=barn
@penguin k.animal name=penguin kind=bird fly=no lives=antarctica  @p1 k.diet about=penguin eats=fish
@w1 k.weight about=cat kg=4  @w2 k.weight about=dog kg=30  @w3 k.weight about=sheep kg=80  @w4 k.weight about=pig kg=150
@w5 k.weight about=elephant kg=5000  @w6 k.weight about=horse kg=500
@dog k.animal name=dog kind=mammal  @m1 k.kind_of about=dog kind=mammal derived=true
@barn k.place name=barn  @antarctica k.place name=antarctica`;
const load = () => { const w = new World(); assert.ok(w.tell(worldText('k.interest')).ok); assert.ok(w.tell(CATALOG).ok); return w; };

test('interest: the published k.interest over computed measures puts the exception over the far number over the obvious', { skip: !worldsDir() && 'offline' }, () => {
  const w = load();
  const [p, e, d] = ['penguin', 'w5', 'm1'].map((id) => interestOf(w, w.get(id), { topic: id === 'w5' ? 'elephant' : id === 'm1' ? 'dog' : 'penguin' }));
  assert.ok(p.by.sibling_contrast > 0, 'a bird that does not fly: contrast with its siblings');
  assert.ok(e.by.far_number > 0 && e.by.extreme > 0, '5,000 kg: far outside the range, and the largest');
  assert.ok(d.by.obvious > 0, 'a derived fact is what the reader assumes');
  assert.ok(p.score > e.score && e.score > d.score, `${p.score} > ${e.score} > ${d.score}`);
  const again = interestOf(w, w.get('penguin'), { topic: 'penguin', said: new Set(['penguin']) });
  assert.ok(again.score < 0, 'said before: never chosen');
  const drawn = interestOf(w, w.get('penguin'), { topic: 'penguin', draw: 7 });
  assert.ok(drawn.score > 0 && drawn.score !== p.score, 'weights drawn inside their ranges with a seed');
  assert.match(interestOf(new World(), w.get('penguin')).why, /no k.interest/);
});

test("compose: the shape asked, each sentence citing its wire, no fact twice, the genre's moves; short said; realised by the host", { skip: !worldsDir() && 'offline' }, () => {
  const w = load();
  const c = compose(w, 'penguin', { size: { chapters: 1, sections: 1, sentences: 2 } }); // no genre: introduce, ..., conclude
  const s = c.chapters[0].sections[0].sentences;
  assert.deepEqual(s.map((x) => x.move), ['introduce', 'conclude']);
  assert.ok(s.every((x) => w.get(x.cites)), 'every claim traces to a wire');
  assert.equal(new Set(s.map((x) => x.cites)).size, s.length, 'no fact twice');
  assert.ok(compose(w, 'penguin', { size: { chapters: 4, sections: 2, sentences: 4 } }).short?.length > 0, 'short of knowledge: said, not padded');
  const r = compose(w, 'elephant', { size: { chapters: 1, sections: 1, sentences: 1 }, realise: (f) => `${f.move}: ${f.cites}` });
  assert.equal(r.chapters[0].sections[0].sentences[0].text, 'introduce: w5');
  assert.match(compose(w, 'penguin', { genre: 'sonnet' }).why, /no genre sonnet/);
});

test('compose by the published k.genres: parts in order, choices solved jointly, no relation twice, summaries restate, a budget', { skip: !worldsDir() && 'offline' }, () => {
  const w = load(); assert.ok(w.tell(worldText('k.genres')).ok);
  w.tell(`@d1 k.diet about=penguin eats=fish  @d2 k.diet about=penguin eats=krill  @d3 k.diet about=penguin eats=squid
    @b1 k.body about=penguin height=1.1m  @b2 k.body about=penguin weight=35kg  @h1 k.habitat about=penguin place=chile`);
  const c = compose(w, 'penguin', { genre: 'presentation' });
  assert.deepEqual(c.parts.map((p) => p.part), ['title', 'agenda', 'point', 'point', 'point', 'summary', 'closing']);
  assert.equal(c.register.name, 'presentation');
  const rels = c.parts.filter((p) => p.part === 'point').map((p) => p.relation);
  assert.equal(new Set(rels).size, 3, 'each point a different relation (joint choice)');
  assert.deepEqual(c.parts[1].moves[0].outline, rels, 'the agenda lists the points');
  const cites = c.parts.flatMap((p) => p.moves.map((m) => m.cites).filter(Boolean));
  assert.equal(new Set(cites).size, cites.length, 'no fact twice');
  assert.ok(c.parts.flatMap((p) => p.moves).every((m) => m.move !== 'compare' || c.parts.find((p) => p.moves.includes(m)).relation !== 'k.habitat'), 'compare only where two facts are left');
  const b = compose(w, 'penguin', { genre: 'presentation', size: { sentences: 30 } });
  assert.ok(b.parts.at(-2).moves.every((m) => m.recalls), 'nothing new left: the summary restates the claims');
  assert.match(b.short.at(-1), /of 30 sentences/);
  assert.match(compose(w, 'penguin', { genre: 'story' }).short[0], /k.story/);
});

test('compose: deterministic by seed and memoised until the world changes (PSys2 21:00: hosts dry-run twice)', { skip: !worldsDir() && 'offline' }, () => {
  const w = load(); w.tell(worldText('k.genres'));
  const a = compose(w, 'penguin', { genre: 'presentation', seed: 3 }), b = compose(w, 'penguin', { genre: 'presentation', seed: 3 });
  assert.equal(a, b, 'the same object: memoised');
  assert.deepEqual(compose(w, 'penguin', { genre: 'presentation', seed: 3, memo: false }), a, 'and the same composition when computed again');
  w.tell('@z1 k.diet about=penguin eats=squid');
  assert.notEqual(compose(w, 'penguin', { genre: 'presentation', seed: 3 }), a, 'a change in the world: computed again');
});

test('compose quality (reviewer 00:05): quiet keys never narrated, a counterargument only with a real contrast, no sentence twice', { skip: !worldsDir() && 'offline' }, () => {
  const w = load(); w.tell(worldText('k.genres'));
  w.tell(`@chad k.country name=chad capital=ndjamena code=TCD code2=TD  @c1 k.place about=chad region=sahel  @c2 k.place about=chad lake=chad_lake
    @c3 k.trade about=chad export=oil  @c4 k.trade about=chad export=cotton`);
  const e = compose(w, 'chad', { genre: 'essay', quiet: ['code', 'code2'] });
  const facts = e.parts.flatMap((p) => p.moves).filter((m) => m.fact);
  assert.ok(facts.every((m) => !('code' in m.fact.attrs) && !('code2' in m.fact.attrs)), 'quiet keys are not narrated');
  assert.ok(e.short?.some((x) => /no fact contrasts/.test(x)), 'no contrast among these facts: the counterargument is left out, and said');
  const said = e.parts.flatMap((p) => p.moves).filter((m) => m.text).map((m) => m.text.toLowerCase());
  assert.equal(new Set(said).size, said.length, 'no sentence twice');
});

test('compose prefers facts about the topic itself for its claims (PSys2: an essay about Peru claimed facts about Lima)', { skip: !worldsDir() && 'offline' }, () => {
  const w = load(); w.tell(worldText('k.genres'));
  w.tell(`@peru k.country name=peru capital=lima  @pe1 k.fact about=peru area=1285216  @pe2 k.fact about=peru language=spanish  @pe3 k.fact about=peru export=copper
    @lima k.city name=lima country=peru population=10000000  @b1 k.border name=bolivia borders=peru  @b2 k.border name=chile borders=peru`);
  const e = compose(w, 'peru', { genre: 'essay' });
  const claims = e.parts.flatMap((p) => p.moves).filter((m) => m.move === 'state claim');
  assert.ok(claims.length && claims.every((m) => m.subject === 'peru'), JSON.stringify(e.parts.map((p) => [p.part, p.moves.map((m) => m.move + '=' + (m.subject ?? ''))])));
});
