// Every sentence the kit says comes from the language world's reply facts (reviewer 17:55): a reply world whose facts
// mark each name shows that every turn's reply went through a name; the published w.lang.en / w.lang.ro replies are
// realised for every name they have, the Romanian ones with no English word; the names they lack are listed (todo).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KIT_REPLIES, replyFrom, loadWorldSet, openSession } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';

test('every reply of readTurn and openSession goes through a reply name', { skip: !worldsDir() && 'offline' }, async () => {
  const { seatingApp } = await import('../examples/seating-app.mjs');
  const { set } = await seatingApp('en');
  const roles = (n, all = false) => KIT_REPLIES[n].roles.filter((r) => all || !r.endsWith('?')).map((r) => `{${r.replace('?', '')}}`).join(' ');
  set.language.load(['@t core.type of=ex.reply', ...Object.keys(KIT_REPLIES).flatMap((n, i) => [`@r${i} ex.reply name=${n} count=one text="[${n} ${roles(n)}]"`, `@m${i} ex.reply name=${n} count=other text="[${n} ${roles(n, true)}]"`])].join('\n'));
  const s = openSession(set, { replies: 'ex.reply' });
  const seen = new Set();
  for (const t of ['add a table called family', 'add 2 tables', 'red', 'red and blue', 'add a guest called Ann at table 1', 'make table 1 square', 'make table 2 blue', 'add a guest called Ann', 'remove Ann', 'undo', 'redo', 'redo', 'why?', 'add a table for 4', 'I have two kids', 'my', 'add a table', 'family']) {
    const r = s.say(t);
    assert.match(r.reply, /^\[[a-z_.]+/, `${t}: ${r.reply}`);
    for (const m of r.reply.matchAll(/\[([a-z_.]+)/g)) seen.add(m[1]);
  }
  assert.ok(seen.size >= 14, [...seen].join(' '));
});

const EN = new Set(['the', 'a', 'an', 'i', 'is', 'are', 'not', 'there', 'what', 'nothing', 'to', 'of', 'you', 'that', 'yet']);

test('the published reply names, realised in English and in Romanian (no English word in the Romanian ones)', { skip: !worldsDir() && 'offline' }, async (t) => {
  const { seatingApp } = await import('../examples/seating-app.mjs');
  const en = (await seatingApp('en')).set.language, ro = await seatingApp('ro');
  const sample = { kind: 'table', thing: 'table', value: 'round', key: 'name', name: 'party', rel: 'at', place: 'table', worlds: 'w.list, w.tasks', given: 1, number: 2, words: '"blorp"', why: '-', request: 'add a table', tier: 'knowledge' };
  const sampleRo = { ...sample, kind: 'masă', thing: 'masă', value: 'rotund', key: 'nume', place: 'masă', why: '-', request: 'adaugă o masă', tier: 'cunoaștere' };
  const missing = { en: [], ro: [] };
  for (const name of Object.keys(KIT_REPLIES)) {
    const roles = Object.fromEntries(KIT_REPLIES[name].roles.filter((r) => !r.endsWith('?')).map((r) => [r, sample[r]]));
    const rolesRo = Object.fromEntries(Object.keys(roles).map((r) => [r, sampleRo[r]]));
    const e = replyFrom(en, name, roles), r = replyFrom(ro.set.language, name, rolesRo, { lang: 'w.lang.ro', dictionary: ro.context.dictionary });
    if (e == null) missing.en.push(name);
    if (r == null) missing.ro.push(name);
    if (r != null) assert.deepEqual(r.toLowerCase().match(/\p{L}+/gu).filter((w) => EN.has(w)), [], `${name}: ${r}`);
  }
  console.log(`# reply names without a fact: en ${missing.en.length} (${missing.en.join(' ')}); ro ${missing.ro.length} (${missing.ro.join(' ')})`);
  for (const lang of ['en', 'ro']) if (missing[lang].length) t.todo(`w.lang.${lang}.reply lacks ${missing[lang].join(', ')} (asked in Q82)`);
  assert.ok(Object.keys(KIT_REPLIES).length - missing.ro.length >= 5);
});
