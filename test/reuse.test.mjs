// Reuse (Round 23): one board-game module as tic-tac-toe and chess; one list module as
// tasks, shopping and playlist; "a reference must exist" as a slot; the detector finds a
// type of the same shape in two worlds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { World } from '../tools/lib-under-test.mjs';
import { tictactoe, chess, tasks, shopping, playlist, board, instance } from '../examples/reuse.mjs';

test('reuse: one board module, two games, each with only what is its own', () => {
  const w = new World();
  w.load([tictactoe, chess].join('\n'));
  w.tell('@t ttt.game user=X  @c chess.game user=white');
  const turns = () => [w.ofType('ttt.turn')[0].attrs.player[0], w.ofType('chess.turn')[0].attrs.player[0]];
  assert.deepEqual(turns(), ['X', 'white']);
  w.tell('@m1 ttt.move by=X n=1 at=4');
  assert.deepEqual(turns(), ['O', 'white'], 'each game counts its own moves');
  assert.equal(w.tell('@m2 ttt.move by=O n=1 at=0').ok, false, 'a move number once');
  w.tell('@c1 chess.move by=white n=1 from=e2');
  assert.deepEqual(w.open('c1').map((o) => o.key), ['to'], 'chess has its own keys');
  w.retract('c1');
  w.tell('@r ttt.result winner=X');
  assert.equal(w.tell('@m3 ttt.move by=O n=2 at=0').violations[0].why, 'The game is over.');
  assert.ok(w.tell('@c2 chess.move by=white n=1 from=e2 to=e4').ok, 'the other game goes on');
});

test('reuse: one list module, three worlds, each with its own words and counts', () => {
  const w = new World();
  w.load([tasks, shopping, playlist].join('\n'));
  w.tell('@a tasks.item title=wash priority=1  @b tasks.item title=cook done=yes  @c shopping.item title=milk quantity=2');
  assert.deepEqual(['tasks', 'shopping', 'playlist'].map((n) => w.ofType(`${n}.status`)[0]?.attrs.open[0]), ['1', '1', '0']);
  assert.deepEqual([...w.words().keys()], ['task', 'tasks', 'thing', 'things', 'song', 'songs']);
  assert.equal(w.tell('@d playlist.item title=x quantity=2').ok, false, 'a song has plays, not a quantity');
  assert.equal(instance(board, 'board', 'go', { players: 'enum=b enum=w', first: 'b', second: 'w' }).includes('board.'), false, 'nothing of the module name left');
});

test('reuse: "a reference must exist" is one slot attribute; the detector sees a type of the same shape', () => {
  const w = new World();
  w.load('@k core.slot of=selection key=of type=shape');
  w.tell('@s1 shape kind=circle');
  assert.equal(w.tell('@x selection of=$s1').ok, true);
  assert.equal(w.tell('@y selection of=$nothing').ok, false);
  const out = execFileSync(process.execPath, ['tools/reuse.mjs', '--json', 'examples/reuse.mjs', 'examples/acts.mjs'], { encoding: 'utf8' });
  const r = JSON.parse(out);
  assert.ok(r.reuse.every((x) => typeof x.reuse === 'number'));
  assert.ok(Array.isArray(r.candidates));
});

test('core.use as=: one library module loaded twice under two names (Q29)', async () => {
  const { list } = await import('../examples/reuse.mjs');
  const generic = list.replace('{amount}', 'amount').replace('{item}', 'item').replace('{items}', 'items');
  const w = new World({ library: { list: generic } });
  w.load('@a core.use world=list as=tasks\n@b core.use world=list as=shopping');
  w.tell('@t1 tasks.item title=wash  @t2 tasks.item title=cook  @s1 shopping.item title=milk amount=2');
  assert.deepEqual([w.ofType('tasks.status')[0].attrs.open, w.ofType('shopping.status')[0].attrs.open], [['2'], ['1']]);
  assert.equal(w.tell('@x tasks.item title=y colour=red').ok, false, 'each instance keeps the module\'s checks');
});
