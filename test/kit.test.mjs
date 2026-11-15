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
  assert.deepEqual([ann.status, ann.request.args.name, ann.request.args.table], ['done', 'Ann', `$${W(set, 'w.seating').ofType('w.seating.table')[0].id}`], 'w.seating 3: a guest has a table; never a guest named "ann at table 1"');
  assert.deepEqual([readTurn(set, 'add a table for 4').request.args.seats], ['4'], 'acts.make.for: the template names the key (seats)');
  assert.equal(readTurn(set, 'add a big table').reading.unread[0], 'big');
  assert.equal(readTurn(set, 'add a guest called Bob').request.args.name, 'Bob', 'a name as written');
  const rm = readTurn(set, 'remove Bob'); readTurn(set, 'remove Ann');
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
  assert.match(wrong.reply, /one of red, blue, not "?green"?\./);
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
  const ro = await catalogWorld({ 'w.lang.ro': ['class', 'ending', 'irregular', 'vowel', 'fold', 'split', 'det', 'reply', 'count'].map((x) => `w.lang.ro.${x}`) });
  const m = morphOf(ro, { types: { cls: 'w.lang.ro.class', ending: 'w.lang.ro.ending', irregular: 'w.lang.ro.irregular', fold: 'w.lang.ro.fold', split: 'w.lang.ro.split', vowel: 'w.lang.ro.vowel' } });
  const file = (l) => { const f = `${worldsDir()}docs/worlds/w.lang.ro/dictionary/${l}.tsv`; return existsSync(f) ? readFileSync(f, 'utf8') : ''; };
  const d = dictionary({ read: file, fold: (s) => fold(m, s) });
  const say = (k, r) => replyFrom(ro, k, r, { lang: 'w.lang.ro', dictionary: d });
  assert.equal(say('done.add', { kind: 'casă' }), 'Am adăugat o casă.');
  assert.equal(say('done.remove', { thing: 'masă' }), 'Am șters masa.');
  assert.equal(say('done.change', { thing: 'casă', value: 'roșu' }), 'Casa este acum roșie.');
  assert.equal(say('done.make.value', { kind: 'cerc', value: 'roșu' }), 'Am desenat un cerc roșu.');
  assert.equal(say('done.undo', {}), 'Am anulat ultima schimbare.');
  // the plural class by the language's CLDR rules (w.lang.ro.count, published for Q79)
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

test('several requests in one message: one step each, all read before any runs; ordinals and "it"; a host reader and its hook; a budget', { skip: !worldsDir() && 'offline' }, async () => {
  const { listsApp } = await import('../examples/lists-app.mjs');
  const { language, bindings } = await listsApp();
  const { worldText } = await import('../tools/worlds.mjs');
  const set = loadWorldSet(worldText, { names: ['w.seating', 'w.list'], language, bindings });
  const two = readTurn(set, 'add a table called one and add a table called two');
  assert.deepEqual([two.status, two.clauses, set.steps.length], ['done', ['add a table called one', 'add a table called two'], 2], 'two clauses, two steps');
  assert.deepEqual(two.effects.map((e) => e.things[0]), ['w_seating_table1', 'w_seating_table2'], 'effects for the page');
  const n = W(set, 'w.seating').wires.size;
  const bad = readTurn(set, 'add a table called three and add a blue table');
  assert.deepEqual([bad.status, W(set, 'w.seating').wires.size], ['not-understood', n], 'one clause cannot run: nothing of the message runs');
  assert.ok(bad.reading.unread.includes('blue'));
  assert.equal(readTurn(set, 'remove the second table').effects[0].things[0], 'w_seating_table2', 'an ordinal of the language world');
  readTurn(set, 'add a guest called Ann');
  assert.equal(readTurn(set, 'remove it').reply, 'I removed the guest.', '"it": the thing the last turn made');
  assert.equal(readTurn(set, 'undo').status, 'done');
  // a host reader (its own formalizer) under the reader contract, and a host request through the hook
  const nav = (s, text) => (/^open the (\w+) tab$/i.test(text) ? [{ request: { action: 'open', args: { tab: text.split(' ')[2] }, host: true }, unread: [] }] : []);
  const opened = readTurn(set, 'open the seating tab', { readers: [nav], onHost: (req) => ({ reply: `Opened ${req.args.tab}.`, effects: [{ kind: 'open', tab: req.args.tab }] }) });
  assert.deepEqual([opened.status, opened.reply, opened.effects], ['done', 'Opened seating.', [{ kind: 'open', tab: 'seating' }]]);
  assert.equal(set.steps.length, 4, 'a host request is not a step of any world');
  const mine = (s, text) => (text === 'big table' ? [{ request: { action: 'make', args: { kind: 'w.seating.table', name: 'big' } }, unread: [] }] : []);
  assert.equal(readTurn(set, 'big table', { readers: [mine] }).reply, 'I added a table.', 'the kit keeps the contract, the arbitration and the execution');
  assert.equal(readTurn(set, 'add a table called x and add a table called y', { budget: { ms: -1 } }).status, 'too-complex', 'over budget: nothing changed');
});

test('clauses: the real shop rows of PSys2 (knowledge Q71) cut where the reference reader cuts', { skip: !worldsDir() && 'offline' }, async () => {
  const { clauses, readFrames } = await import('../tools/lib-under-test.mjs');
  const { catalogWorld } = await import('../tools/worlds.mjs');
  const L = await catalogWorld({ 'w.lang.en': ['frame', 'part', 'phrase', 'lex', 'det', 'numeral', 'prep', 'wh', 'aux', 'pron', 'joiner'].map((x) => `w.lang.en.${x}`), 'k.actions': ['k.actions.verb'] });
  const verbs = Object.fromEntries(L.ofType('k.actions.verb').map((v) => [String(v.attrs.text[0]).replace(/"/g, '').toLowerCase(), String(v.attrs.act[0]).replace(/"/g, '')]));
  const read = (t) => { const r = readFrames(L, t, { lang: 'w.lang.en', senses: (id) => (id && verbs[String(id).toLowerCase()] ? { act: verbs[String(id).toLowerCase()], en: id } : {}) }); if (!r.best) return null; const lit = r.tokens.length - Object.values(r.best.roles).reduce((k, v) => k + String(v.text ?? '').split(/\s+/).filter(Boolean).length, 0); return lit > 0 ? { literal: lit } : null; };
  const rows = { r0590: ['i should call grandma', 1], r0598: ['I want a puzzle and I pay 10 lei. What is the change?', 3], r0599: ['I want 2 pencils and I give the cashier 10 lei. How much change do I get?', 3], r0622: ["I would like a ball and a pencil and pay with 20 lei. what's the change", 3], r0623: ['how much does a pencil cost?', 1], r0625: ['I want a ball and a pencil and pay with 20 lei what is the change', 3] };
  for (const [id, [text, n]] of Object.entries(rows)) assert.equal(clauses(L, text, { read })?.length, n, `${id}: ${text}`);
  assert.deepEqual(clauses(L, "I would like a ball and a pencil and pay with 20 lei. what's the change", { read }).map((c) => c.text), ['I would like a ball and a pencil', 'pay with 20 lei', "what's the change"], 'a list stays one clause; a joiner before a verb cuts');
  assert.deepEqual(clauses(L, 'remove the fourth grass and the third water lily', { read }).map((c) => c.text), ['remove the fourth grass and the third water lily'], 'a list of things with a two-word thing is one clause (Q35 of an application)');
  assert.deepEqual(clauses(L, 'show the work done and remove the water lilies', { read }).map((c) => c.text), ['show the work done', 'remove the water lilies']);
});
