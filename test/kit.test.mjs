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
  const ask = readTurn(set, 'make a shopping list');
  assert.deepEqual([ask.status, ask.asks[0].key, set.live.ofType('w.list.list').length], ['ask', 'name', 0], 'a required key is asked before anything is made');
  const made = readTurn(set, 'make a shopping list called weekly');
  assert.equal(made.status, 'done');
  assert.deepEqual([set.live.ofType('w.list.list')[0].attrs.sort[0], set.live.ofType('w.list.list')[0].attrs.name[0]], ['shopping', 'weekly'], 'a value word of the kind is its value; the called role is its name');
  assert.equal(made.reply, 'I made a list.', 'the kind said by its word, no id');
  const add = readTurn(set, 'add 2 apples to my weekly list');
  assert.deepEqual([add.status, add.request.args.text, add.request.args.quantity], ['done', 'apples', 2]);
  const size = set.live.wires.size;
  const no = readTurn(set, 'make a purple dragon');
  assert.deepEqual([no.status, no.reading.unread, set.live.wires.size], ['not-understood', ['purple', 'dragon'], size], 'never acted on');
  assert.match(no.reply, /"purple", "dragon"/);
  assert.equal(readTurn(set, 'I have two kids').status, 'not-understood');
  for (const t of ['make a list called b', 'add milk to the list', 'add bread to my weekly list', 'make a shopping list called c']) { // the turn-scope property
    const r = readTurn(set, t);
    if (r.status === 'done') assert.ok(r.changed.every(turnScope(set, r.owner)), `${t}: ${r.changed}`);
  }
});

test('the seating world on the kit: every role a frame fills lands in an argument or is named; a place the kind cannot take is said', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const { language } = await listsApp();
  const { worldText } = await import('../tools/worlds.mjs');
  const set = loadWorldSet(worldText, { names: ['w.seating'], language });
  const t = readTurn(set, 'add a table called family');
  assert.deepEqual([t.status, t.request.args.name, t.reply], ['done', 'family', 'I made a table.']);
  assert.deepEqual([readTurn(set, 'add 2 tables').status, set.live.ofType('w.seating.table').length], ['ask', 1], 'two tables need two names: asked, nothing made');
  const round = readTurn(set, 'add a round table called kids');
  assert.deepEqual([round.request.args.shape, round.request.args.name], ['round', 'kids']);
  const ann = readTurn(set, 'add a guest called Ann at table 1');
  assert.deepEqual([ann.status, ann.reply, set.live.ofType('w.seating.guest').length], ['not-understood', 'A guest has no place at a table.', 0], 'a guest sits on a seat in w.seating: never a guest named "ann at table 1"');
  assert.deepEqual(readTurn(set, 'add a table for 4').reading.unread, ['for', '4']);
  assert.deepEqual(readTurn(set, 'add a blue table').reading.unread, ['blue']);
  assert.equal(readTurn(set, 'add a guest called Ann').request.args.name, 'Ann', 'a name as written');
  const rm = readTurn(set, 'remove Ann');
  assert.deepEqual([rm.status, rm.reply, set.live.ofType('w.seating.guest').length], ['done', 'I removed the guest.', 0], 'a referent by its name');
  assert.equal(readTurn(set, 'undo').status, 'done');
  assert.equal(set.live.ofType('w.seating.guest').length, 1);
  assert.equal(readTurn(set, 'undo the colour change').status, 'not-understood', 'an undo with words it cannot use is not a plain undo');
});

test('property: for every frame example of the language world, a done turn used every word its roles filled', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const { language, bindings } = await listsApp();
  const { worldText } = await import('../tools/worlds.mjs');
  const { valueText } = await import('../src/parser.mjs');
  const examples = language.ofType('w.lang.en.frame').flatMap((f) => (f.attrs.example || []).map(valueText));
  assert.ok(examples.length > 300);
  let done = 0;
  for (const ex of examples) {
    const set = loadWorldSet(worldText, { names: ['w.seating', 'w.list', 'w.tasks'], language, bindings });
    for (const t of ['add a table called one', 'add a guest called Ann', 'make a list called groceries']) readTurn(set, t);
    const r = readTurn(set, ex);
    if (r.status !== 'done' || !r.request?.args) continue;
    done++;
    if (r.request.action === 'remove') set.live.undo(); // the thing is back, to say what named it
    const said = new Set(), add = (x) => valueText(String(x)).toLowerCase().split(/\s+/).forEach((y) => { said.add(y); said.add(y.replace(/s$/, '')); });
    const wordsOf = (type) => set.live.ofType('core.word').filter((w) => (w.attrs.means || []).map(valueText).includes(type)).flatMap((w) => w.attrs.text || []);
    for (const v of Object.values(r.request.args)) {
      const id = String(v).startsWith('$') && set.live.get(String(v).slice(1));
      if (id) { Object.values(id.attrs).flat().forEach(add); wordsOf(id.type).forEach(add); add(String(set.live.ofType(id.type).indexOf(id) + 1)); } else add(v); // a referent: its values, its kind's words, its place in order
    }
    if (r.request.args.kind) wordsOf(r.request.args.kind).forEach(add);
    const roleWords = Object.entries(r.reading.roles || {}).filter(([k]) => k !== 'rel').flatMap(([, v]) => String(v.text ?? '').toLowerCase().split(/\s+/)).filter(Boolean);
    const lost = roleWords.filter((w) => !said.has(w) && !said.has(w.replace(/s$/, '')));
    assert.deepEqual(lost, [], `${ex}: ${JSON.stringify(r.request.args)}`);
  }
  assert.ok(done >= 20, `${done} examples done`);
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
  assert.deepEqual([made.status, made.pending.key, made.pending.ask, set.live.ofType('w.toy.shape').length], ['ask', 'colour', 'Which colour?', 0], 'asked before it is made');
  assert.match(made.reply, /Which colour\?$/);
  const wrong = s.say('green');
  assert.deepEqual([wrong.status, wrong.pending.key], ['ask', 'colour'], 'still pending');
  assert.match(wrong.reply, /one of red, blue, not "green"/);
  const red = s.say('red');
  assert.deepEqual([red.status, red.pending, set.live.ofType('w.toy.shape')[0].attrs.colour], ['done', null, ['red']]);
  assert.equal(s.say('undo').status, 'done');
  assert.equal(set.live.ofType('w.toy.shape').length, 0, 'one step back: the shape made by the answer');
  s.say('redo');
  assert.deepEqual(set.live.ofType('w.toy.shape')[0].attrs.colour, ['red']);
  s.say('make a shape');
  assert.equal(s.say('remove the shape').pending, null, 'a new request drops the question');
});

test('a session: a confirmation answered yes makes what was missing and runs the message again; a list named by an answer', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const set = await listsApp();
  const s = openSession(set);
  assert.equal(s.say('make a list').pending.key, 'name');
  assert.equal(set.live.ofType('w.list.list').length, 0);
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
