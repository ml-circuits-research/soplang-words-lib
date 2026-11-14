// One segmenter that knows the act forms (Round 28 item 2, from PSys2's lessons): cuts
// where an act word follows a joiner; lists and coordinations stay whole; a run of joiners
// is one; a comma after a frame lead never cuts. Toy facts here; the published w.lang.en
// clause facts below.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { World, segment } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';

const TOY = `@acts core.use world=std.acts
@j1 g.joiner text="," cut=yes card_cut=yes  @j2 g.joiner text=and cut=yes card_cut=yes  @j3 g.joiner text=then cut=yes
@f1 g.frame_lead text="from now on"
@w1 core.word text=add text=create means=make  @w2 core.word text=link means=connect`;
const cut = (w, s, o) => segment(w, s, o).map((c) => c.text);

test('segment: an act word after a joiner cuts; a list does not; a run of joiners is one; a frame lead keeps its comma', () => {
  const w = new World(); w.load(TOY);
  assert.deepEqual(cut(w, 'add a box and connect it to the shelf'), ['add a box', 'connect it to the shelf'], 'add X and connect A to it');
  assert.deepEqual(cut(w, 'make a cup, a plate and a bowl'), ['make a cup, a plate and a bowl'], 'a list stays one clause');
  assert.deepEqual(cut(w, 'ann, bob and cy'), ['ann, bob and cy'], 'a name list');
  assert.deepEqual(segment(w, 'create a table and then link it to the wall').map((c) => [c.text, c.joiner ?? null]), [['create a table', null], ['link it to the wall', 'and then']], 'synonyms of acts through core.word; one joiner run');
  assert.deepEqual(cut(w, 'from now on, make the tables round, then remove the lamp'), ['from now on, make the tables round', 'remove the lamp'], 'the comma after a frame lead stays');
});

const LANG = worldsDir() ? `${worldsDir()}docs/worlds/w.lang.en/` : null;
test('segment: with the published w.lang.en clause facts', { skip: !LANG && 'the knowledge repository cannot be read here' }, () => {
  const w = new World();
  w.load('@acts core.use world=std.acts');
  w.tell(readFileSync(`${LANG}shards/clauses.sop`, 'utf8'));
  const o = { types: { joiner: 'w.lang.en.joiner', frameLead: 'w.lang.en.frame_lead' }, acts: ['add', 'draw', 'put'] };
  assert.deepEqual(cut(w, 'draw a red circle and also add a square', o), ['draw a red circle', 'add a square']);
  assert.deepEqual(cut(w, 'from now on, draw circles in blue', o), ['from now on, draw circles in blue']);
  assert.deepEqual(cut(w, 'put the cat, the dog and the bird on the mat', o), ['put the cat, the dog and the bird on the mat']);
});
