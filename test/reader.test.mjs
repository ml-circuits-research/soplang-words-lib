// The reader core on descriptions written for pattern generation (R12.3): a neutral shop with
// an operation word, argument words with forms, number words and unit words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { shop, items, words } from '../examples/reader.mjs';

const make = () => { const w = new World(); w.load(shop); w.tell(items); w.tell(words); return w; };
const parts = (c) => (c.parts || [c]).map((p) => [p.wires, p.refer?.r1?.where.name]);

test('reader: words written for pattern generation load cleanly and read "buy two pens and one ink" as two lines', () => {
  const w = make();
  assert.deepEqual([w.ofType('core.word').length, w.warnings], [16, []]);
  const r = w.interpret([
    [{ lang: 'en', verb: 'buy', args: ['two', 'pens'] }, { lang: 'en', args: ['one', 'ink'] }],
    [{ lang: 'en', verb: 'buy', args: ['two', 'pens', 'one', 'ink'] }],
  ]);
  const s = w.score(r.candidates);
  const top = r.candidates[s.order[0]];
  assert.deepEqual(parts(top), [['@new1 line qty=2 item=$r1', 'pen'], ['@new2 line qty=1 item=$r1', 'ink']]);
  // the second frame took the verb of the first, and its words replaced the first's
  assert.deepEqual([top.parts[1].inherited, top.parts[1].replaced], [{ words: [], verb: 'buy' }, ['two', 'pens']]);
  assert.deepEqual([s.candidates[s.order[1]].on, w.veto(s).answer], ['words', true]);
  assert.equal(w.ofType('line').length, 0, 'nothing told');
});

test('reader: forms, units and numbers in two languages; a typo; loose words; examples read back', () => {
  const w = make();
  const top = (r) => { const s = w.score(r.candidates); return r.candidates[s.order[0]]; };
  assert.deepEqual(parts(top(w.interpret({ lang: 'ro', verb: 'cumpără', args: ['două', 'cutii', 'pixuri'] }))), [['@new line qty=2 unit=box item=$r1', 'pen']]);
  assert.deepEqual(parts(top(w.interpret({ lang: 'en', verb: 'get', args: ['three', 'boxes', 'inks'] }))), [['@new line qty=3 unit=box item=$r1', 'ink']]);
  const typo = top(w.interpret({ lang: 'en', verb: 'buy', args: ['a', 'pnes'] }));
  assert.deepEqual([parts(typo), typo.assumes], [[['@new line qty=1 item=$r1', 'pen']], [{ word: 'pnes', read: 'pens' }]]);
  assert.deepEqual(parts(top(w.interpret({ lang: 'en', words: ['pens', 'two', 'buy'] }))), [['@new line item=$r1 qty=2', 'pen']]);
  // every generated example reads back to a candidate of its own tool
  const ex = w.examples('en', { statement: '{verb} {qty} {unit} {item}' }, { all: true, per: 2 });
  assert.deepEqual(ex.map((e) => e.text), ['buy one piece pen', 'buy one box pen', 'price pen?', 'price ink?']);
  for (const e of ex) {
    const cands = w.interpret(e.frame).candidates;
    assert.ok(cands.some((c) => (e.expect.question ? JSON.stringify(c.question) === JSON.stringify(e.expect.question) : c.wires?.split(' ')[1] === e.expect.type)), e.text);
  }
});
