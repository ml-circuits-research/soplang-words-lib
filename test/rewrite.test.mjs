// Rewrites of a clause chosen by std.decide kind intent (Q35 of an application), and a clause cutter that never cuts a
// thing of several words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose, chooseRewrite, clauses, readTurn, loadWorldSet, World } from '../tools/lib-under-test.mjs';

test('std.decide kind intent is data: reads, covers, slots, present, previous, cost', () => {
  const r = choose(null, 'intent', [{ issues: 0, uncovered: 1 }, { issues: 0, uncovered: 0 }], { seed: null });
  assert.deepEqual(r.criteria.map((c) => c.name), ['reads', 'covers', 'slots', 'present', 'previous', 'cost']);
  assert.equal(r.best.uncovered, 0);
});

test('chooseRewrite: a rewrite wins only when it reads strictly better; words it explains are not left out; the previous turn and absent things count', () => {
  const reads = { 'make the diagram more beautiful': 3, 'improve the diagram': 0, 'tidy the diagram': 0, 'remove the cat': 2, 'remove the dog': 2 };
  const read = (t) => ({ issues: reads[t] ?? 3, absent: t === 'remove the cat' ? 1 : 0 });
  const stop = ['the', 'a', 'more'];
  const r = chooseRewrite('make the diagram more beautiful', [{ text: 'tidy the diagram', cost: 2, explains: ['make', 'beautiful'], via: 'improve' }, { text: 'improve the diagram', cost: 1, explains: ['make', 'beautiful'], via: 'improve' }, { text: 'draw a diagram', cost: 1 }], { read, stop });
  assert.deepEqual([r.changed, r.chosen.text, r.chosen.uncovered], [true, 'improve the diagram', 0]);
  assert.match(r.why, /^reads 0, covers 0, slots 0, present 0, previous 0, cost 1$/);
  const same = chooseRewrite('remove it', [{ text: 'remove the cat' }, { text: 'remove the dog' }], { read: (t) => ({ issues: t === 'remove it' ? 2 : read(t).issues, absent: read(t).absent }), previous: ['the dog'] });
  assert.deepEqual([same.changed, same.chosen.text, same.order.map((c) => c.text)], [false, 'remove it', ['remove it', 'remove the dog', 'remove the cat']], 'no better than the clause: kept; the dog, there and of the previous turn, before the cat');
  const prev = chooseRewrite('remove it', [{ text: 'remove the cat' }, { text: 'remove the dog' }], { read: (t) => ({ issues: t === 'remove it' ? 3 : 2, absent: 0 }), previous: ['the dog'] });
  assert.equal(prev.chosen.text, 'remove the dog');
  assert.throws(() => chooseRewrite('x', []), /needs read/);
});

test('clauses: a thing of several words is not cut, and a joiner before a determiner joins a list', () => {
  const L = new World();
  L.load('@t.j core.type of=w.lang.en.joiner\n@t.d core.type of=w.lang.en.det\n@j1 w.lang.en.joiner text=and cut=yes\n@d1 w.lang.en.det text=the\n@d2 w.lang.en.det text=a');
  const read = () => ({ literal: 1 }); // every piece reads: the cutting with most clauses would win
  const cut = (t, o = {}) => clauses(L, t, { read, ...o }).map((c) => c.text);
  assert.deepEqual(cut('show salt and pepper'), ['show salt', 'pepper']);
  assert.deepEqual(cut('show salt and pepper', { whole: ['salt and pepper'] }), ['show salt and pepper']);
  assert.deepEqual(cut('remove the fourth grass and the third water lily'), ['remove the fourth grass and the third water lily']);
  assert.deepEqual(cut('add 2 ducks and 3 frogs'), ['add 2 ducks and 3 frogs']);
  assert.deepEqual(cut('remove the grass and add a duck'), ['remove the grass', 'add a duck']);
});

const TOY = `@w.toy core.module name=w.toy version=1 exports=shape
@w.toy.world std.schema.world name=w.toy
@w.toy.shape core.type of=w.toy.shape extends=std.schema.thing closed=true
@w.toy.shape.colour core.slot of=w.toy.shape key=colour required=true enum=red enum=blue
@w.toy.kind.shape std.schema.kind of=w.toy.shape world=w.toy acts=make acts=change acts=remove`;

test('readTurn: rewrites of a clause that does not run, chosen by kind intent, said in the result; dry runs nothing', () => {
  const set = () => loadWorldSet((n) => (n === 'w.toy' ? TOY : null), { names: ['w.toy'] });
  const reader = (s, text) => (/^make a (red|blue) shape$/.test(text) ? [{ request: { action: 'make', args: { kind: 'w.toy.shape', colour: text.split(' ')[2] } }, unread: [] }] : []);
  const ctx = { readers: [reader], frames: false, rewrites: [{ text: 'make a nice shape', cost: 1 }, { text: 'make a red shape', cost: 2, explains: ['beautiful'], via: 'improve' }] };
  const s1 = set();
  const r = readTurn(s1, 'make a beautiful red shape', ctx);
  assert.deepEqual([r.status, r.rewrites[0].as, r.rewrites[0].via, r.rewrites[0].changed], ['done', 'make a red shape', 'improve', true]);
  assert.equal(s1.worlds.get('w.toy').world.ofType('w.toy.shape').length, 1);
  const s2 = set();
  const d = readTurn(s2, 'make a beautiful red shape', { ...ctx, dry: true });
  assert.deepEqual([d.status, d.clauses, d.plans[0].as, s2.worlds.get('w.toy').world.ofType('w.toy.shape').length], ['planned', ['make a red shape'], 'request', 0]);
  const s3 = set();
  const n = readTurn(s3, 'make a beautiful red shape', { ...ctx, rewrites: () => [{ text: 'paint it' }] });
  assert.deepEqual([n.status, n.rewrites[0].changed, n.rewrites[0].as], ['not-understood', false, 'make a beautiful red shape']);
  assert.equal(readTurn(set(), 'make a red shape', ctx).rewrites, undefined, 'a clause that runs is not rewritten');
});
