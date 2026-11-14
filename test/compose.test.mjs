// std.compose, first version (reviewer 14:45 B, 15:00): a composition of a genre about a topic
// from a toy catalog (invented, in the formats proposed in questions.md Q41): the outline from
// the topic's relations, chosen by interest; every sentence cites a wire; no fact twice; the
// requested shape exact, or what was short said.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, compose, interestOf } from '../tools/lib-under-test.mjs';

const CATALOG = `@owl k.animal name=owl lives=barn eats=mouse
@mouse k.animal name=mouse lives=field
@barn k.place name=barn built=1702
@f1 k.fact about=owl what=night_hunter
@f2 k.fact about=owl head_turn=270deg
@f3 k.fact about=owl what=silent_flight
@f4 k.fact about=owl eggs=4
@s1 k.story_link a=owl b=moon shared=night
@g1 k.genres.genre name=presentation move=introduce move=fact move=compare move=conclude
@i1 k.interest.feature name=number weight=2  @i2 k.interest.feature name=link weight=1.5  @i3 k.interest.feature name=distance weight=1`;

test("compose: the shape asked, each sentence citing its wire, no fact twice, the genre's moves in order", () => {
  const w = new World(); w.tell(CATALOG);
  const c = compose(w, 'owl', { genre: 'presentation', size: { chapters: 2, sections: 1, sentences: 3 }, seed: 1 });
  assert.equal(c.chapters.length, 2);
  const all = c.chapters.flatMap((ch) => ch.sections.flatMap((s) => s.sentences));
  assert.ok(all.every((x) => w.get(x.cites)), 'every claim traces to a wire');
  assert.equal(new Set(all.map((x) => x.cites)).size, all.length, 'no fact twice');
  const first = c.chapters[0].sections[0].sentences;
  assert.deepEqual(first.map((x) => x.move), ['introduce', 'fact', 'conclude']);
  assert.equal(first[0].cites, 'owl', 'the topic itself opens');
  assert.equal(c.chapters[0].title, 'k.fact', 'the most interesting relation first (numbers weigh 2)');
});

test('compose: interest explained by feature; a size the knowledge cannot fill is said; realised by the host', () => {
  const w = new World(); w.tell(CATALOG);
  assert.deepEqual(interestOf(w, w.get('f2'), { topicType: 'k.animal' }).by.number, 2);
  assert.equal(interestOf(w, w.get('owl'), { topicType: 'k.animal', topic: 'owl' }).by.link, 1.5, 'barn and mouse are names of other facts: links');
  const big = compose(w, 'owl', { size: { chapters: 5, sections: 2, sentences: 4 } });
  assert.ok(big.short?.length > 0, 'short of knowledge: said, not padded');
  const r = compose(w, 'owl', { size: { chapters: 1, sections: 1, sentences: 2 }, realise: (f) => `${f.move}: ${f.cites}` });
  assert.ok(r.chapters[0].sections[0].sentences.every((x) => x.text.startsWith(x.move)));
  assert.match(compose(w, 'owl', { genre: 'sonnet' }).why, /no genre sonnet/);
});
