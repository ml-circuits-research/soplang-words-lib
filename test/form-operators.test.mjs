// Form operators (owner 16:12, reviewer 23:20): from aligned pairs (canonical ↔ variant with the same
// meaning), the operators are extracted, clustered and checked on held-out pairs; few operators cover most
// pairs. Toy pairs, invented here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formOperator, learnFormOperators } from '../tools/lib-under-test.mjs';

test('formOperator: the shared runs become variables, what is left is the operator', () => {
  assert.deepEqual(formOperator('open the door', 'could you open the door'), { from: 'could you {x1}', to: '{x1}' });
  assert.deepEqual(formOperator('the cat opens the door', 'the door is opened by the cat'), { from: '{x1} is opened by {x2}', to: '{x2} opens {x1}' });
  assert.deepEqual(formOperator('make a red circle', 'um make a red circle'), { from: 'um {x1}', to: '{x1}' });
});

test('learnFormOperators: pairs clustered into few operators, each checked on held-out pairs, the coverage counted', () => {
  const P = (c, v) => ({ canonical: c, variant: v });
  const pairs = [P('open the door', 'could you open the door'), P('make a red circle', 'could you make a red circle'), P('remove the cat', 'could you remove the cat'),
    P('open the door', 'please open the door'), P('remove the cat', 'please remove the cat'), P('add a table', 'um add a table'), P('add a table', 'add a table please')];
  const r = learnFormOperators(pairs, { heldOut: [P('move the box', 'could you move the box'), P('save it', 'please save it')] });
  assert.deepEqual(r.operators.slice(0, 2).map((o) => [o.from, o.support.length, o.heldOut.pass, o.heldOut.of, o.admitted]), [['could you {x1}', 3, 1, 1, true], ['please {x1}', 2, 1, 1, true]]);
  assert.deepEqual(r.coverage, { pairs: 7, operators: 4, at80: 3, at95: 4 });
});

test('cousins under form operators: each operator (learnt, noise, synonym) tagged, so the tester says "fails under operator X"', async () => {
  const { World, cousins, readByTypes } = await import('../tools/lib-under-test.mjs');
  const { cousinsTest } = await import('../tools/cousins-test.mjs');
  const w = new World();
  w.tell('@cow k.animal name=cow sound=moo  @s1 k.words.sense word=noise pos=noun n=1 synonym=sound');
  const O = { question: ['what', 'does'], skip: ['the', 'of', 'tell', 'me', 'could', 'you', 'please', 'um'] };
  const text = 'tell me the sound of the cow', kase = { text, frame: readByTypes(w, text, O).best };
  const operators = learnFormOperators([{ canonical: 'open it', variant: 'could you open it' }, { canonical: 'add one', variant: 'um add one' }]).operators;
  const cs = cousins(w, kase, { dims: ['wording'], operators, read: O });
  assert.deepEqual(cs.map((c) => c.dims[0]).sort(), ['form:op1', 'form:op2', 'form:synonym']);
  const host = (t) => (/\bsound\b/.test(t) && !/\bum\b/.test(t) ? ['moo'] : null); // a host that fails on fillers and synonyms
  const r = cousinsTest(w, kase, host, { dims: ['wording'], operators, read: O });
  assert.match(r.pattern[0], /fails when .*form:op2.*changes|fails when .*form:synonym/);
});

test('formEdits / learnFormEdits: a variant that combines operators splits into atomic edits, clustered with their coverage', async () => {
  const { formEdits, learnFormEdits } = await import('../tools/lib-under-test.mjs');
  assert.deepEqual(formEdits('what sound does a cow make', 'um what sound a cow makes'), [{ del: 'um', ins: '', at: 'start' }, { del: '', ins: 'does', at: 'inside' }, { del: 'makes', ins: 'make', at: 'end' }]);
  const P = (c, v) => ({ canonical: c, variant: v });
  const r = learnFormEdits([P('open the door', 'um open the door'), P('add a cat', 'um add a cat'), P('add a cat', 'hey add a cat'), P('save it', 'um save it please')]);
  assert.deepEqual(r.operators.slice(0, 1), [{ edit: 'start: "um" -> ""', count: 3, family: 'filler' }]);
  assert.deepEqual(r.families, { filler: 5 });
  assert.deepEqual(r.coverage, { at80: 2, at95: 3, pairsAt80: 3, pairsAt95: 3 });
});
