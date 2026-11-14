// Several readers, one confidence (reviewer 02:30): parallel voices pooled, std.decide (kind ensemble)
// combines, a confidence, a question back below the threshold, and a risk–coverage curve. A toy world.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readEnsemble, riskCoverage, calibrate } from '../tools/lib-under-test.mjs';

const w = new World();
w.tell(`@t core.type of=w.lang.en.alternation  @t1 core.slot of=w.lang.en.alternation key=name kind=atom kind=string
  @t2 core.slot of=w.lang.en.alternation key=from kind=atom kind=string  @t3 core.slot of=w.lang.en.alternation key=to kind=atom kind=string
  @a1 w.lang.en.alternation name=could_you from="could you {x}" to="{x}"
  @cow k.animal name=cow sound=moo legs=4  @dog k.animal name=dog sound=woof legs=4
  @s1 k.words.sense word=noise pos=noun n=1 synonym=sound  @v core.word text=make text=makes means=sound`);
const read = { question: ['what', 'does', 'tell', 'me'], skip: ['a', 'the', 'and', 'then'] };

test('readEnsemble: voices agree → high confidence; a near word only one reader takes → lower confidence', () => {
  const a = readEnsemble(w, 'what sound does a cow make', { read });
  assert.deepEqual([a.frame.key, a.frame.of.id, a.confidence, a.voices.sort()], ['sound', 'cow', 1, ['canonical', 'types']]);
  assert.equal(a.ask, undefined);
  const b = readEnsemble(w, 'what noise does a cow make', { read });
  assert.equal(b.frame.key, 'sound');
  assert.ok(b.voices.includes('types'), 'the typed reader takes the synonym through word senses');
});

test('readEnsemble: below the threshold, a question back with the competing readings; a host voice joins', () => {
  const host = { guess: () => [{ frame: { is: 'ask', key: 'legs', of: { id: 'dog' } }, unread: 0, cost: 0 }] };
  const r = readEnsemble(w, 'what noise does a cow make', { read, readers: { ...host, types: (ww, t) => [{ frame: { is: 'ask', key: 'sound', of: { id: 'cow' } } }] }, threshold: 0.9 });
  assert.ok(r.ask?.length === 2, 'two readings tie, each with one voice: ask');
  const rows = [{ confidence: 1, correct: true }, { confidence: 1, correct: true }, { confidence: 0.67, correct: true }, { confidence: 0.33, correct: false }];
  assert.deepEqual(riskCoverage(rows), [{ threshold: 1, coverage: 0.5, risk: 0 }, { threshold: 0.67, coverage: 0.75, risk: 0 }, { threshold: 0.33, coverage: 1, risk: 0.25 }]);
});

test('calibrate: a reader\'s confidence mapped to a probability, isotonic and Platt, on held-out rows', () => {
  const rows = []; for (let i = 0; i < 200; i++) { const s = i / 200; rows.push({ confidence: s, correct: ((i * 7919) % 100) / 100 < s * s }); } // the truth: right with probability s²
  const iso = calibrate(rows), platt = calibrate(rows, { method: 'platt' });
  for (const c of [iso, platt]) assert.ok(c.brier.after < c.brier.before, `${c.method}: ${JSON.stringify(c.brier)}`);
  assert.ok(Math.abs(iso.p(0.5) - 0.25) < 0.1 && Math.abs(platt.p(0.9) - 0.81) < 0.1);
  assert.ok(iso.steps.every((x, i, a) => !i || a[i - 1].p <= x.p), 'isotonic: never decreasing');
  assert.equal(calibrate([]).p(0.5), null);
});
