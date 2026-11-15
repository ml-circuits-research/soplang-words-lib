// The host kit (reviewer 13:15 item 5, 13:50): a second application (examples/lists-app.mjs) runs on it alone. An
// incomplete reading is never acted on; a turn changes only the world it addresses and the session (a property
// over a set of messages); a kind is said by its word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTurn, turnScope, openSession, replyFrom, loadWorldSet, World } from '../tools/lib-under-test.mjs';
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

const TOY = `@w.toy core.module name=w.toy version=1 exports=shape
@w.toy.world std.schema.world name=w.toy
@w.toy.shape core.type of=w.toy.shape extends=std.schema.thing closed=true
@w.toy.shape.colour core.slot of=w.toy.shape key=colour required=true enum=red enum=blue ask="Which colour?"
@w.toy.kind.shape std.schema.kind of=w.toy.shape world=w.toy acts=make acts=change acts=remove
@w.toy.word.shape core.word text=shape text=shapes means=w.toy.shape`;

test('a session: the pending question and the slot its answer fills; a value that does not fit is said and asked again; undo and redo by the language world\'s phrases', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const { language } = await listsApp();
  const set = loadWorldSet((n) => (n === 'w.toy' ? TOY : null), { names: ['w.toy'], language });
  const s = openSession(set);
  const made = s.say('make a shape');
  assert.deepEqual([made.status, made.pending.key, made.pending.ask], ['done', 'colour', 'Which colour?']);
  assert.match(made.reply, /Which colour\?$/);
  const wrong = s.say('green');
  assert.deepEqual([wrong.status, wrong.pending.key], ['ask', 'colour'], 'still pending');
  assert.match(wrong.reply, /one of red, blue, not "green"/);
  const red = s.say('red');
  assert.deepEqual([red.status, red.pending, set.live.ofType('w.toy.shape')[0].attrs.colour], ['done', null, ['red']]);
  assert.equal(s.say('undo').status, 'done');
  assert.equal(set.live.ofType('w.toy.shape')[0].attrs.colour, undefined, 'one step back: the answer');
  s.say('redo');
  assert.deepEqual(set.live.ofType('w.toy.shape')[0].attrs.colour, ['red']);
  const again = s.say('make a shape');
  assert.equal(s.say('make a shape').pending.thing !== again.pending.thing, true, 'a new request drops the question and opens its own');
});

test('a session: a confirmation answered yes makes what was missing and runs the message again; a list named by an answer', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const set = await listsApp();
  const s = openSession(set);
  assert.equal(s.say('make a list').pending.key, 'name');
  assert.deepEqual(s.say('groceries').status, 'done');
  assert.equal(set.live.ofType('w.list.list')[0].attrs.name[0], 'groceries');
  const ask = s.say('add bread to my party list');
  assert.deepEqual([ask.status, ask.pending.confirm.args.name], ['ask', 'party']);
  const yes = s.say('yes');
  assert.equal(yes.status, 'done');
  const party = set.live.ofType('w.list.list').find((l) => l.attrs.name?.[0] === 'party');
  assert.equal(set.live.ofType('w.list.item').find((i) => i.attrs.text[0] === 'bread').attrs.list[0], `$${party.id}`);
  assert.equal(s.say('add milk to it').pending, null, 'a message with a verb is never taken as a name');
});

test('replies from the language world\'s reply facts when it has them; null otherwise (the library sentence stays)', () => {
  const L = new World();
  L.load('@t core.type of=w.lang.en.reply\n@r1 w.lang.en.reply act=make text="I made a new {kind}."\n@r2 w.lang.en.reply act=make text="I made {amount} new {kind}."');
  assert.equal(replyFrom(L, 'make', { kind: 'list' }), 'I made a new list.');
  assert.equal(replyFrom(L, 'make', { kind: 'list', amount: 2 }), 'I made 2 new list.', 'the fact with the most slots given');
  assert.equal(replyFrom(L, 'remove', { thing: 'list' }), null);
});
