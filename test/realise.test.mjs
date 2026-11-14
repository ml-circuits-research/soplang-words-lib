// Realisation through the language world's discourse templates (w.lang.en.discourse, read in place):
// a template of the frame's move and register whose slots all fill; a story sentence tells its own
// element and only elements told before it; no sentence twice while another fits; what has no
// template is said, not invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compose, discourseRealiser, discourseTemplates } from '../tools/lib-under-test.mjs';
import { worldsDir, catalogWorld } from '../tools/worlds.mjs';

const offline = !worldsDir() && 'offline';
const CATALOG = { 'k.story': ['k.story.element', 'k.story.goal', 'k.story.obstacle', 'k.story.constraint'], 'k.scenes': ['k.scenes.scene', 'k.scenes.has'],
  'k.actions': ['k.actions.action'], 'k.people': ['k.people.role', 'k.people.kind'], 'k.animals': ['k.animals.animal'], 'k.objects': ['k.objects.object'],
  'w.lang.en': ['w.lang.en.discourse', 'w.lang.en.slot'], 'k.genres': ['k.genres.genre', 'k.genres.part', 'k.genres.step', 'k.genres.move', 'k.genres.register'],
  'k.interest': ['k.interest.appraisal', 'k.interest.feature'] };

test('discourse realiser: stories and presentations realised by the published templates, each sentence from a template, nothing invented', { skip: offline }, async () => {
  const w = await catalogWorld(CATALOG);
  assert.ok(discourseTemplates(w).length >= 100);
  const s = compose(w, 'girl', { genre: 'story', seed: 2 });
  const said = s.parts.flatMap((p) => p.moves).filter((m) => m.text);
  assert.ok(said.length >= 8, `${said.length} story sentences realised`);
  assert.equal(new Set(said.map((m) => m.text)).size, said.length, 'no sentence twice');
  assert.ok(said.every((m) => m.template && w.get(m.template)), 'each names its template');
  for (const m of said) if (['setting', 'helper', 'means', 'attempt'].includes(m.element)) assert.ok(m.text.includes(m.value), `${m.element}=${m.value} in "${m.text}"`);
  const helperAt = said.findIndex((m) => m.text.includes(s.story.plan.helper));
  assert.ok(said.findIndex((m) => m.element === 'helper') <= helperAt, 'the helper is not named before it is introduced');
  const silent = s.parts.flatMap((p) => p.moves).filter((m) => !m.text).length;
  if (silent) assert.match(s.short.at(-1), new RegExp(`^${silent} sentences have no template`));
  w.tell('@pz k.animal name=penguin  @d1 k.diet about=penguin eats=fish  @d2 k.diet about=penguin eats=krill  @b1 k.body about=penguin height=1.1m  @b2 k.body about=penguin weight=35kg');
  const p = compose(w, 'penguin', { genre: 'presentation', seed: 2 });
  assert.match(p.parts[0].moves[0].text, /penguin/);
  assert.equal(p.parts.at(-1).moves[0].text, 'Thank you for listening.');
  const own = compose(w, 'penguin', { genre: 'presentation', realise: () => 'x' });
  assert.ok(own.parts.flatMap((q) => q.moves).every((m) => m.text === 'x'), 'a host realiser comes first');
  const r = discourseRealiser(w, { fill: (slot) => (slot === 'topic' ? 'Penguins' : undefined) });
  assert.match(r({ move: 'introduce topic' }, 'presentation', {}).text, /Penguins/);
});
