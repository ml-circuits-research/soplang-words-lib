// Experiment and ablation harnesses (Round 28 item 9): cells → ledger rows; configurations × sets → a table,
// what each mechanism buys, failures grouped by cause. The host here is readCanonical / readByTypes on a toy
// world, with its pipeline steps turned on and off.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, experiment, ablation, readByTypes, canonicalise } from '../tools/lib-under-test.mjs';

const w = new World();
w.tell('@cow k.animal name=cow sound=moo  @dog k.animal name=dog sound=woof  @s1 k.words.sense word=noise pos=noun n=1 synonym=sound  @v core.word text=make text=makes means=sound');
const O = { question: ['what', 'does'], skip: ['a', 'the', 'say'] };
const cells = [
  { id: 'plain', input: 'what sound does a cow make', expect: ['moo'], set: 'plain' },
  { id: 'syn', input: 'what noise does a dog make', expect: ['woof'], set: 'lexical' },
  { id: 'filler', input: 'um what sound does a dog make', expect: ['woof'], set: 'noise' },
];
const run = (text, cfg) => {
  const t = cfg.fillers ? canonicalise(w, text, { fillers: ['um'] }).clauses[0].text : text;
  const r = readByTypes(w, t, { ...O, near: cfg.near ? 3 : 0 });
  return r.unread.length ? null : r.best?.answer;
};

test('experiment: cells with expectations become ledger rows', () => {
  const rows = experiment(cells, run, { config: { near: true, fillers: true }, name: 'all', stage: (got) => (got ? 'acting' : 'reading') });
  assert.deepEqual(rows.map((r) => [r.cell, r.pass]), [['plain', true], ['syn', true], ['filler', true]]);
  assert.equal(rows[0].source, 'experiment');
});

test('ablation: configurations × sets, what each mechanism buys against the baseline, failures by cause', () => {
  const r = ablation(cells, run, { none: {}, near: { near: true }, fillers: { fillers: true }, all: { near: true, fillers: true } },
    { stage: () => 'reading', signals: [['unread word', (row) => row.got === null]] });
  assert.deepEqual(r.table.none, { plain: { pass: 1, of: 1 }, lexical: { pass: 0, of: 1 }, noise: { pass: 0, of: 1 } });
  assert.deepEqual(r.buys.near, { gains: ['syn'], losses: [] }, 'near words buy the lexical cell');
  assert.deepEqual(r.buys.fillers, { gains: ['filler'], losses: [] });
  assert.deepEqual(r.buys.all.gains.sort(), ['filler', 'syn']);
  assert.deepEqual(r.causes.none, [{ key: 'reading / - / unread word', rows: 2 }]);
});
