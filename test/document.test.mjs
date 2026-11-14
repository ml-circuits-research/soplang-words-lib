// A composition written as the published w.document world schema (read in place) through std.acts,
// and read back in order with its sources (reviewer 20:05 item 1: w.document as compose's output).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { World, compose, writeDocument, readDocument } from '../tools/lib-under-test.mjs';
import { worldsDir, worldText } from '../tools/worlds.mjs';

const offline = !worldsDir() && 'offline';
function setup() {
  const w = new World({ library: { 'w.document': readFileSync(`${worldsDir()}docs/worlds/w.document/schema.sop`, 'utf8') } });
  assert.ok(w.load('@acts core.use world=std.acts').ok); w.use('w.document');
  for (const n of ['k.interest', 'k.genres']) assert.ok(w.tell(worldText(n)).ok);
  w.tell(`@penguin k.animal name=penguin  @d1 k.diet about=penguin eats=fish  @d2 k.diet about=penguin eats=krill
    @b1 k.body about=penguin height=1.1m  @b2 k.body about=penguin weight=35kg  @h1 k.habitat about=penguin place=chile  @h2 k.habitat about=penguin place=antarctica`);
  return w;
}

test('writeDocument: a presentation as slides, an essay as chapters, every sentence with its move and the wires it states', { skip: offline }, () => {
  const w = setup();
  const p = compose(w, 'penguin', { genre: 'presentation' });
  const r = writeDocument(w, p, { title: 'Penguins', realise: (f) => `${f.move} (${f.cites ?? ''})` });
  assert.deepEqual(r.refused, []);
  const back = readDocument(w, r.document);
  assert.equal(back.genre, 'presentation');
  assert.equal(w.ofType('w.document.slide').length, p.parts.length, 'one slide per part');
  assert.deepEqual(back.parts.map((x) => x.part), p.parts.map((x) => x.part), 'read back in order');
  const said = back.parts.flatMap((x) => x.sentences);
  assert.equal(said.length, p.parts.reduce((s, x) => s + x.moves.length, 0));
  assert.ok(said.filter((s) => s.facts.length).every((s) => s.facts.every((id) => w.get(id))), 'every source is a wire of the world');
  const e = writeDocument(w, compose(w, 'penguin', { genre: 'essay' }));
  assert.deepEqual(e.refused, []);
  assert.ok(w.ofType('w.document.chapter').length >= 5 && w.ofType('w.document.paragraph').length >= 5, 'chapters with paragraphs');
  assert.match(readDocument(w, e.document).parts[0].sentences[0].text, /^\[introduce topic\]/, 'without a realiser: a placeholder that says the move');
  assert.match(writeDocument(w, { chapters: [] }).why, /no parts/);
});
