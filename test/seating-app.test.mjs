// The second application extended (reviewer 16:45 item 2): the published w.seating on the host kit alone, in English and
// Romanian; PSys2's probe B (its Q24) is the acceptance list. examples/seating-app.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { worldsDir } from '../tools/worlds.mjs';

const W = (set) => set.worlds.get('w.seating').world;

test('seating in English: probe B', { skip: !worldsDir() && 'offline' }, async () => {
  const { seatingApp } = await import('../examples/seating-app.mjs');
  const { set, session: s } = await seatingApp('en');
  const say = (t) => s.say(t);
  assert.deepEqual([say('add a table called family').reply, W(set).ofType('w.seating.table')[0].attrs.name[0]], ['I added a table.', 'family']);
  assert.deepEqual(say('add 2 tables').status, 'ask', 'two tables need two names');
  assert.equal(say('red and blue').reply, 'I added 2 tables.');
  const ann = say('add a guest called Ann at table 1');
  assert.deepEqual([ann.status, ann.reply, W(set).ofType('w.seating.guest').length], ['done', 'I added a guest.', 1], 'w.seating 3: a guest has a table');
  say('remove Ann');
  const sq = say('make table 2 square');
  assert.deepEqual([sq.reply, W(set).ofType('w.seating.table')[1].attrs.shape[0]], ['The table is square now.', 'square'], 'a value of a closed set: change');
  assert.deepEqual([say('make table 1 blue').reply, W(set).ofType('w.seating.table')[0].attrs.colour[0]], ['The table is blue now.', 'blue'], 'w.seating 3 has colour');
  say('add a guest called Ann');
  assert.deepEqual([say('remove Ann').reply, W(set).ofType('w.seating.guest').length], ['I removed the guest.', 0]);
  assert.equal(say('undo').reply, 'I undid the last change.');
  assert.equal(W(set).ofType('w.seating.guest')[0].attrs.name[0], 'Ann');
  const four = say('add a table for 4');
  assert.deepEqual([four.status, four.request.args.seats], ['ask', '4'], 'knowledge Q85 (1): a complete reading wins before a finer one that leaves words unread');
});

test('seating in Romanian: the same acts from w.lang.ro frames, replies from w.lang.ro.reply', { skip: !worldsDir() && 'offline' }, async () => {
  const { seatingApp } = await import('../examples/seating-app.mjs');
  const { set, session: s } = await seatingApp('ro');
  const made = s.say('adaugă o masă numită familie');
  assert.deepEqual([made.reply, W(set).ofType('w.seating.table')[0].attrs.name[0]], ['Am adăugat o masă.', 'familie']);
  const round = s.say('adaugă o masă rotundă numită copii');
  assert.deepEqual([round.request.args.shape, round.request.args.name], ['round', 'copii'], 'the kind\'s word first, its value after it');
  assert.equal(s.say('adaugă două mese').status, 'ask');
  assert.equal(s.say('șterge masa familie').reply, 'Am șters masa.');
  assert.equal(s.say('anulează').reply, 'Am anulat ultima schimbare.');
  assert.equal(W(set).ofType('w.seating.table').length, 2);
  const blue = s.say('fă masa 1 albastră');
  assert.deepEqual([blue.request.args.value, blue.reply], ['blue', 'Masa este acum albastră.'], 'knowledge Q85 (2): the value by its sense, said back in the user\'s word');
  assert.deepEqual(s.say('adaugă o masă pentru 4').request.args.seats, '4');
  assert.deepEqual(s.say('adaugă o masă înaltă').reading.unread, ['înaltă'], 'an unread word as the user wrote it');
  const ana = s.say('adaugă un invitat numit Ana la masa 1');
  assert.equal(ana.reply, 'Am adăugat un invitat.');
});

test('the session: "why?" over the last turn\'s facts; a snapshot restored in a new set keeps the worlds, undo and redo', { skip: !worldsDir() && 'offline' }, async () => {
  const { seatingApp } = await import('../examples/seating-app.mjs');
  const { session: s } = await seatingApp('en');
  s.say('add a table called family');
  assert.equal(s.say('why?').reply, 'You asked: "add a table called family". The name is family because you said so. The shape is round by default.');
  s.say('add a guest called Ann');
  s.say('make table 1 square');
  const why = s.say('why did you do that');
  assert.deepEqual(why.facts.map((f) => [f.key, f.value, f.tier]), [['shape', 'square', 'told']], 'a change: the key it changed');
  const snap = JSON.parse(JSON.stringify(s.snapshot()));
  const app = await seatingApp('en');
  app.session.restore(snap);
  assert.deepEqual([W(app.set).ofType('w.seating.table')[0].attrs.shape[0], W(app.set).ofType('w.seating.guest').length], ['square', 1]);
  app.session.say('undo');
  assert.equal(W(app.set).ofType('w.seating.table')[0].attrs.shape[0], 'round', 'undo after a restart');
  app.session.say('undo');
  assert.equal(W(app.set).ofType('w.seating.guest').length, 0, 'the timeline across the restore');
  app.session.say('redo');
  assert.equal(W(app.set).ofType('w.seating.guest').length, 1);
});

test('refusals by code and roles: none, which, and a std.acts refusal said by its reply name', { skip: !worldsDir() && 'offline' }, async () => {
  const { seatingApp } = await import('../examples/seating-app.mjs');
  const { session: s, set } = await seatingApp('en');
  assert.deepEqual([s.say('remove the table').status, s.say('remove the table').reply], ['refused', 'There is no table here.']);
  s.say('add a table called a'); s.say('add a table called b');
  const which = s.say('remove the table');
  assert.deepEqual([which.status, which.reply, W(set).ofType('w.seating.table').length], ['ask', 'Which table? There are 2.', 2]);
  const { readTurn } = await import('../tools/lib-under-test.mjs');
  const r = readTurn(set, 'x', { readers: [() => [{ request: { action: 'change', args: { thing: `$${W(set).ofType('w.seating.table')[0].id}`, attr: 'height', value: 'red' } }, unread: [] }]] });
  assert.equal(r.reply, 'A table has no height.', 'std.acts refusal code no_key with its roles');
});
