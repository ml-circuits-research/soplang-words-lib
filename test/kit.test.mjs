// The host kit (reviewer 13:15 item 5, 13:50): a second application (examples/lists-app.mjs) runs on it alone. An
// incomplete reading is never acted on; a turn changes only the world it addresses and the session (a property
// over a set of messages); a kind is said by its word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTurn, turnScope, openSession, replyFrom, countClass, loadWorldSet, World } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';

const W = (set, name) => set.worlds.get(name).world;
const size = (set) => [...set.worlds.values()].reduce((n, w) => n + w.world.wires.size, 0);
const thingsOf = (set, type) => [...set.worlds.values()].flatMap((w) => w.world.ofType(type));
const thing = (set, id) => [...set.worlds.values()].map((w) => w.world.get(id)).find(Boolean);

test('the lists app on the kit: a request acts, words left unread are named and nothing changes, a statement is not a request', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const set = await listsApp();
  const ask = readTurn(set, 'make a shopping list');
  assert.deepEqual([ask.status, ask.asks[0].key, W(set, 'w.list').ofType('w.list.list').length], ['ask', 'name', 0], 'a required key is asked before anything is made');
  const made = readTurn(set, 'make a shopping list called weekly');
  assert.equal(made.status, 'done');
  assert.deepEqual([W(set, 'w.list').ofType('w.list.list')[0].attrs.sort[0], W(set, 'w.list').ofType('w.list.list')[0].attrs.name[0]], ['shopping', 'weekly'], 'a value word of the kind is its value; the called role is its name');
  assert.equal(made.reply, 'I added a list.', 'composed from w.lang.en.reply done.add, the kind by its word, no id');
  const add = readTurn(set, 'add 2 apples to my weekly list');
  assert.deepEqual([add.status, add.request.args.text, add.request.args.quantity], ['done', 'apples', 2]);
  const n0 = size(set);
  const no = readTurn(set, 'make a purple dragon');
  assert.deepEqual([no.status, no.reading.unread, size(set)], ["not-understood", ["purple", "dragon"], n0], 'never acted on');
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
  assert.deepEqual([t.status, t.request.args.name, t.reply], ['done', 'family', 'I added a table.']);
  assert.deepEqual([readTurn(set, 'add 2 tables').status, W(set, 'w.seating').ofType('w.seating.table').length], ['ask', 1], 'two tables need two names: asked, nothing made');
  const round = readTurn(set, 'add a round table called kids');
  assert.deepEqual([round.request.args.shape, round.request.args.name], ['round', 'kids']);
  const ann = readTurn(set, 'add a guest called Ann at table 1');
  assert.deepEqual([ann.status, ann.reply, W(set, 'w.seating').ofType('w.seating.guest').length], ['not-understood', 'A guest has no place at a table.', 0], 'a guest sits on a seat in w.seating: never a guest named "ann at table 1"');
  assert.deepEqual(readTurn(set, 'add a table for 4').reading.unread, ['for', '4']);
  assert.deepEqual(readTurn(set, 'add a blue table').reading.unread, ['blue']);
  assert.equal(readTurn(set, 'add a guest called Ann').request.args.name, 'Ann', 'a name as written');
  const rm = readTurn(set, 'remove Ann');
  assert.deepEqual([rm.status, rm.reply, W(set, 'w.seating').ofType('w.seating.guest').length], ['done', 'I removed the guest.', 0], 'a referent by its name');
  assert.equal(readTurn(set, 'undo').status, 'done');
  assert.equal(W(set, 'w.seating').ofType('w.seating.guest').length, 1);
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
    if (r.request.action === 'remove') readTurn(set, 'undo'); // the thing is back, to say what named it
    const said = new Set(), add = (x) => valueText(String(x)).toLowerCase().split(/\s+/).forEach((y) => { said.add(y); said.add(y.replace(/s$/, '')); });
    const wordsOf = (type) => set.schema.ofType('core.word').filter((w) => (w.attrs.means || []).map(valueText).includes(type)).flatMap((w) => w.attrs.text || []);
    for (const v of Object.values(r.request.args)) {
      const id = String(v).startsWith('$') && thing(set, String(v).slice(1));
      if (id) { Object.values(id.attrs).flat().forEach(add); wordsOf(id.type).forEach(add); add(String(thingsOf(set, id.type).indexOf(id) + 1)); } else add(v); // a referent: its values, its kind's words, its place in order
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
  assert.deepEqual([made.status, made.pending.key, made.pending.ask, W(set, 'w.toy').ofType('w.toy.shape').length], ['ask', 'colour', 'Which colour?', 0], 'asked before it is made');
  assert.match(made.reply, /Which colour\?$/);
  const wrong = s.say('green');
  assert.deepEqual([wrong.status, wrong.pending.key], ['ask', 'colour'], 'still pending');
  assert.match(wrong.reply, /one of red, blue, not "green"/);
  const red = s.say('red');
  assert.deepEqual([red.status, red.pending, W(set, 'w.toy').ofType('w.toy.shape')[0].attrs.colour], ['done', null, ['red']]);
  assert.equal(s.say('undo').status, 'done');
  assert.equal(W(set, 'w.toy').ofType('w.toy.shape').length, 0, 'one step back: the shape made by the answer');
  s.say('redo');
  assert.deepEqual(W(set, 'w.toy').ofType('w.toy.shape')[0].attrs.colour, ['red']);
  s.say('make a shape');
  assert.equal(s.say('remove the shape').pending, null, 'a new request drops the question');
});

test('a session: a confirmation answered yes makes what was missing and runs the message again; a list named by an answer', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const set = await listsApp();
  const s = openSession(set);
  assert.equal(s.say('make a list').pending.key, 'name');
  assert.equal(W(set, 'w.list').ofType('w.list.list').length, 0);
  assert.deepEqual(s.say('groceries').status, 'done');
  assert.equal(W(set, 'w.list').ofType('w.list.list')[0].attrs.name[0], 'groceries');
  const ask = s.say('add bread to my party list');
  assert.deepEqual([ask.status, ask.pending.confirm.args.name], ['ask', 'party']);
  const yes = s.say('yes');
  assert.equal(yes.status, 'done');
  const party = W(set, 'w.list').ofType('w.list.list').find((l) => l.attrs.name?.[0] === 'party');
  assert.equal(W(set, 'w.list').ofType('w.list.item').find((i) => i.attrs.text[0] === 'bread').attrs.list[0], `$${party.id}`);
  assert.equal(s.say('add milk to it').pending, null, 'a message with a verb is never taken as a name');
});

test('replies from the language world\'s reply facts: by name or act, by the plural class of the number, the most roles given; null otherwise', () => {
  const L = new World();
  L.load('@t core.type of=w.lang.en.reply\n@r1 w.lang.en.reply name=done.add count=one act=make text="I made a new {kind}."\n@r2 w.lang.en.reply name=done.add count=other act=make text="I made {number} new {kind}."\n@r3 w.lang.en.reply name=not_understood text="Not understood: {words}."');
  assert.equal(replyFrom(L, 'done.add', { kind: 'list' }), 'I made a new list.');
  assert.equal(replyFrom(L, 'done.add', { kind: 'list', number: 2 }), 'I made 2 new list.', 'count other (no plural rules here)');
  assert.equal(replyFrom(L, 'make', { kind: 'list' }), 'I made a new list.', 'by act when no name matches');
  assert.equal(replyFrom(L, 'not_understood', { words: '"blorp"' }), 'Not understood: "blorp".');
  assert.equal(replyFrom(L, 'remove', { thing: 'list' }), null);
  L.load('@c core.type of=w.lang.en.count\n@c1 w.lang.en.count class=one rule="i = 1 and v = 0"');
  assert.deepEqual([1, 2, 0, 1.5].map((n) => countClass(L, n)), ['one', 'other', 'other', 'other'], 'CLDR rules of the language world');
});

test('Romanian replies from w.lang.ro.reply with the hand dictionary: article, plural class, agreement (and the indefinite genitive)', { skip: !worldsDir() && 'offline' }, async () => {
  const { catalogWorld } = await import('../tools/worlds.mjs');
  const { readFileSync, existsSync } = await import('node:fs');
  const { morphOf, dictionary, fold, realise } = await import('../tools/lib-under-test.mjs');
  const ro = await catalogWorld({ 'w.lang.ro': ['class', 'ending', 'irregular', 'vowel', 'fold', 'split', 'det', 'reply'].map((x) => `w.lang.ro.${x}`) });
  const m = morphOf(ro, { types: { cls: 'w.lang.ro.class', ending: 'w.lang.ro.ending', irregular: 'w.lang.ro.irregular', fold: 'w.lang.ro.fold', split: 'w.lang.ro.split', vowel: 'w.lang.ro.vowel' } });
  const file = (l) => { const f = `${worldsDir()}docs/worlds/w.lang.ro/dictionary/${l}.tsv`; return existsSync(f) ? readFileSync(f, 'utf8') : ''; };
  const d = dictionary({ read: file, fold: (s) => fold(m, s) });
  const say = (k, r) => replyFrom(ro, k, r, { lang: 'w.lang.ro', dictionary: d });
  assert.equal(say('done.add', { kind: 'casă' }), 'Am adăugat o casă.');
  assert.equal(say('done.remove', { thing: 'masă' }), 'Am șters masa.');
  assert.equal(say('done.change', { thing: 'casă', value: 'roșu' }), 'Casa este acum roșie.');
  assert.equal(say('done.make.value', { kind: 'cerc', value: 'roșu' }), 'Am desenat un cerc roșu.');
  assert.equal(say('done.undo', {}), 'Am anulat ultima schimbare.');
  // the plural class needs the language's CLDR rules (asked of the knowledge repository, Q79): toy rules here
  ro.load('@c core.type of=w.lang.ro.count\n@c1 w.lang.ro.count class=one rule="i = 1 and v = 0"\n@c2 w.lang.ro.count class=few rule="v != 0 or n = 0 or n % 100 = 2..19"');
  assert.equal(say('done.add', { kind: 'masă', number: 3 }), 'Am adăugat 3 mese.');
  assert.equal(say('done.add', { kind: 'masă', number: 20 }), 'Am adăugat 20 de mese.');
  assert.equal(realise(m, 'în forma {art@thing} {thing:case=gendat,def=no}', { thing: 'casă', art: 'un' }, { dictionary: d }), 'în forma unei case', 'the article takes the case of the word it agrees with (PSys2 Q25 L1)');
});

test('one World per world: a turn changes only the world it addresses and the host\'s session worlds; a stray change to a second world is seen', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const { language, bindings } = await listsApp();
  const { worldText } = await import('../tools/worlds.mjs');
  const set = loadWorldSet(worldText, { names: ['w.list', 'w.tasks', 'w.seating'], language, bindings });
  assert.equal(new Set([...set.worlds.values()].map((w) => w.world)).size, 3, 'three Worlds');
  assert.deepEqual(set.worlds.get('w.tasks').imports, ['w.list'], 'a composite is explicit: w.tasks reads w.list');
  assert.deepEqual(set.worlds.get('w.tasks').kinds, ['w.tasks.task'], 'and owns only its own kinds');
  for (const t of ['add a table called one', 'make a list called groceries', 'add milk to my groceries list', 'add a guest called Ann', 'remove Ann', 'undo']) {
    const r = readTurn(set, t);
    assert.equal(r.status, 'done', t);
    if (r.changed) assert.ok(r.changed.every(turnScope(set, r.owner)), `${t}: ${JSON.stringify(r.changed)}`);
  }
  assert.equal(W(set, 'w.list').ofType('w.seating.table').length, 0, 'a table lives in w.seating only');
  assert.equal(W(set, 'w.seating').ofType('w.seating.guest').length, 1, 'undo went to the world the last step touched');
  // the property catches the bug it exists for: a turn whose effect also lands in a second world
  const stray = readTurn(set, 'add a table called two', { reply: (w, req, res) => { W(set, 'w.list').act({ action: 'make', args: { kind: 'w.list.list', name: 'stray' } }); return 'ok'; } });
  assert.equal(stray.owner, 'w.seating');
  assert.ok(stray.changed.some((c) => c.world === 'w.list'));
  assert.equal(stray.changed.every(turnScope(set, stray.owner)), false);
  const withSession = loadWorldSet(worldText, { names: ['w.list', 'w.seating'], language, bindings, session: ['w.list'] });
  assert.equal(turnScope(withSession, 'w.seating')({ world: 'w.list', type: 'w.list.list' }), true, 'a session world named by the host may change on any turn');
});

test('loadWorldSet refuses what does not load: no kind of its own, types nothing declares, imports that go round', () => {
  const texts = {
    'w.none': '@w.none core.module name=w.none version=1\n@w.none.world std.schema.world name=w.none',
    'w.odd': '@w.odd core.module name=w.odd version=1\n@w.odd.world std.schema.world name=w.odd\n@w.odd.t core.type of=w.odd.t extends=std.schema.thing\n@w.odd.kind std.schema.kind of=w.odd.t world=w.odd acts=make\n@x acts.schema.slot of=w.odd.t key=name',
    'w.a': '@w.a core.module name=w.a version=1 imports=w.b\n@w.a.world std.schema.world name=w.a',
    'w.b': '@w.b core.module name=w.b version=1 imports=w.a\n@w.b.world std.schema.world name=w.b',
  };
  const load = (n) => () => loadWorldSet((x) => texts[x] ?? null, { names: [n] });
  assert.throws(load('w.none'), /w.none declares no kind of its own/);
  assert.throws(load('w.odd'), /types nothing declares: acts.schema.slot/);
  assert.throws(load('w.a'), /imports go round: w.a -> w.b -> w.a/);
  assert.throws(load('w.gone'), /no text for w.gone/);
});
