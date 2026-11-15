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
  assert.deepEqual([ann.status, ann.reply, W(set).ofType('w.seating.guest').length], ['not-understood', 'A guest has no place at a table.', 0], 'w.seating seats a guest on a seat (Q26): said, nothing made');
  const sq = say('make table 2 square');
  assert.deepEqual([sq.reply, W(set).ofType('w.seating.table')[1].attrs.shape[0]], ['The table is square now.', 'square'], 'a value of a closed set: change');
  assert.equal(say('make table 2 blue').status, 'not-understood', 'w.seating has no colour');
  say('add a guest called Ann');
  assert.deepEqual([say('remove Ann').reply, W(set).ofType('w.seating.guest').length], ['I removed the guest.', 0]);
  assert.equal(say('undo').reply, 'I undid the last change.');
  assert.equal(W(set).ofType('w.seating.guest')[0].attrs.name[0], 'Ann');
  assert.deepEqual(say('add a table for 4').reading.unread, ['for', '4']);
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
  assert.deepEqual(s.say('adaugă o masă albastră').reading.unread, ['albastră'], 'an unread word as the user wrote it');
});
