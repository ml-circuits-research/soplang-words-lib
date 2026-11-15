// The host kit (reviewer 13:15 item 5, 13:50): a second application (examples/lists-app.mjs) runs on it alone. An
// incomplete reading is never acted on; a turn changes only the world it addresses and the session (a property
// over a set of messages); a kind is said by its word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTurn, turnScope } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';

test('the lists app on the kit: a request acts, words left unread are named and nothing changes, a statement is not a request', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const set = await listsApp();
  const made = readTurn(set, 'make a shopping list');
  assert.equal(made.status, 'done');
  assert.equal(set.live.ofType('w.list.list')[0].attrs.sort[0], 'shopping', 'a value word of the kind is its value');
  assert.match(made.reply, /made a list/, 'the kind said by its word, not its type');
  const add = readTurn(set, 'add 2 apples to my shopping list');
  assert.deepEqual([add.status, add.request.args.text, add.request.args.quantity], ['done', 'apples', 2]);
  const size = set.live.wires.size;
  const no = readTurn(set, 'make a purple dragon');
  assert.deepEqual([no.status, no.reading.unread, set.live.wires.size], ['not-understood', ['purple', 'dragon'], size], 'never acted on');
  assert.match(no.reply, /"purple", "dragon"/);
  assert.equal(readTurn(set, 'I have two kids').status, 'not-understood');
  for (const t of ['make a list', 'add milk to the list', 'add bread to my shopping list', 'make a shopping list']) { // the turn-scope property
    const r = readTurn(set, t);
    if (r.status === 'done') assert.ok(r.changed.every(turnScope(set, r.owner)), `${t}: ${r.changed}`);
  }
});
