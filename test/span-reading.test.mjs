import test from 'node:test';
import assert from 'node:assert/strict';

const bundle = process.env.SOPWORLD_BUNDLE === '1';
const { stripPhrase, splitPhrase, readLexicalPhrase, readNumberSpan, unitConversion, decodeCode, nearestName } = await import(bundle ? '../docs/sopworld.mjs' : '../src/index.mjs');

// An invented lexicon: every word list below is the caller's declaration, not the library's.
const entries = [['glorp', 'k.glorp'], ['zint', 'k.zint'], ['zint thing', 'k.zint'], ['blarvex', 'k.blarvex'], ['wug', 'k.thing'], ['grape', 'k.grape'], ['grope', 'k.grope']];
const forms = (w) => [w, w.endsWith('s') ? w.slice(0, -1) : w];
const tolerance = { minLength: 4, doubled: true, swapped: true, steps: [{ above: 0, edits: 1 }, { above: 6, edits: 2 }] };
const read = (p, extra = {}) => readLexicalPhrase(p, { entries, leading: ['da', 'ka'], forms, avoid: 'k.thing', tolerance, ...extra });

test('a phrase is read after its declared leading words and by its words\' declared forms', () => {
  assert.deepEqual(read('da glorps'), { text: 'glorp', meaning: 'k.glorp', via: 'phrase' });
  assert.equal(read('da'), null, 'a lone leading word names nothing');
  assert.equal(read('zint wug').meaning, 'k.zint', 'a modifier before the class word');
  assert.equal(read('wug').meaning, 'k.thing', 'the class word itself when nothing else is said');
});

test('one word is read within the declared tolerance, only when the entries in reach mean one thing', () => {
  assert.equal(read('glorrp').via, 'doubled');
  assert.equal(read('glorb').meaning, 'k.glorp');
  assert.equal(read('zitn').via, 'swapped');
  assert.equal(read('blarvix').via, 'edit');
  assert.equal(read('blrvx'), null, 'beyond the longer word\'s reach');
  assert.equal(read('grxpe'), null, 'two entries within reach that mean different things');
  assert.equal(read('zinx').meaning, 'k.zint', 'one edit reaches zint');
  assert.equal(read('wux'), null, 'shorter than minLength');
  assert.equal(read('blarvix', { tolerance: null }), null, 'no tolerance declared');
});

test('stripPhrase and splitPhrase remove and split at declared words only', () => {
  assert.deepEqual(stripPhrase('Da glorp yonder', { leading: ['da'], trailing: ['yonder'] }), { core: 'glorp', leading: 'da', trailing: 'yonder' });
  assert.deepEqual(stripPhrase('yonder', { trailing: ['yonder'] }), { core: 'yonder', leading: null, trailing: null });
  assert.deepEqual(splitPhrase('glorp plus zint, wug', { separators: ['plus'], marks: [','] }), ['glorp', 'zint', 'wug']);
  assert.deepEqual(splitPhrase('glorp', { separators: ['plus'] }), ['glorp']);
});

test('readNumberSpan reads digits or a run of declared number words, with a declared unit conversion', () => {
  const values = { un: 1, deu: 2, sixo: 6, sixta: 60, centa: 100 };
  const number = (w) => values[w] ?? null;
  assert.equal(readNumberSpan('size 45', { number }).value, 45);
  assert.equal(readNumberSpan('deu centa et sixta', { number, joiners: ['et'] }).value, 260);
  assert.equal(readNumberSpan('sixta sixo', { number }).value, 66);
  assert.equal(readNumberSpan('5 by 3', { number }), null, 'two numbers');
  const unit = (w) => unitConversion(w, [{ words: ['dot'], factor: 1 }, { words: ['span'], factor: 7.5 }], { forms, known: (x) => x === 'league' });
  assert.equal(readNumberSpan('150 dots wide', { number, unit, forms }).value, 150);
  assert.deepEqual(readNumberSpan('2 spans', { number, unit, forms }), { value: 15, factor: 7.5 });
  assert.equal(readNumberSpan('3 leagues', { number, unit, forms }), null, 'a declared unit without a conversion');
});

test('nearestName decodes a declared code layout and picks the nearest declared name', () => {
  const layout = { prefix: '#', channels: 3, width: 2, radix: 16 };
  assert.deepEqual(decodeCode('#0a0b0c', layout), [10, 11, 12]);
  assert.equal(decodeCode('0a0b', layout), null);
  const names = [{ name: 'dim', code: '#101010' }, { name: 'bright', code: '#f0f0f0' }, { name: 'bad', code: 'x' }];
  assert.equal(nearestName('#202020', names, layout), 'dim');
  assert.equal(nearestName('#f0f0f0', names, layout), 'bright');
  assert.equal(nearestName('nope', names, layout), null);
});
