// Alternations as rules, once (abstraction round item 2, Q54): variants brought back to one canonical
// form at read time. The rules are a toy set written here in the proposed language-world format
// (`w.lang.en.alternation name= from= to= mode=`) until the knowledge repository publishes them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, normalise, alternationsOf, parseText } from '../tools/lib-under-test.mjs';

const RULES = `@t core.type of=w.lang.en.alternation  @t1 core.slot of=w.lang.en.alternation key=name kind=atom kind=string
@t2 core.slot of=w.lang.en.alternation key=from kind=atom kind=string  @t3 core.slot of=w.lang.en.alternation key=to kind=atom kind=string
@t4 core.slot of=w.lang.en.alternation key=mode kind=atom kind=string
@a1 w.lang.en.alternation name=please from="please {x}" to="{x}" mode=request
@a2 w.lang.en.alternation name=could_you from="[could|can|would|will] you {x}" to="{x}" mode=request
@a3 w.lang.en.alternation name=i_want_you_to from="i [want|need] you to {x}" to="{x}" mode=request
@a4 w.lang.en.alternation name=passive from="{y} [is|was|are|were] {v} by {x}" to="{x} {v:base} {y}"
@a5 w.lang.en.alternation name=dative from="give {y} to {x}" to="give {x} {y}"`;

test('normalise: every variant of a frame comes back to its canonical form, the rules named', () => {
  const w = new World(); assert.ok(w.tell(RULES).ok);
  assert.equal(alternationsOf(w).length, 5);
  const canon = 'open the door';
  for (const v of ['please open the door', 'could you open the door?', 'I want you to open the door', 'can you please open the door']) assert.equal(normalise(w, v).text, canon, v);
  const r = normalise(w, 'can you please open the door');
  assert.deepEqual([r.applied, r.mode], [['could_you', 'please'], 'request']);
  assert.equal(normalise(w, 'the door was opened by the cat').text, 'the cat open the door');
  assert.equal(normalise(w, 'give the ball to the dog').text, 'give the dog the ball');
  assert.deepEqual(normalise(w, 'open the door').applied, [], 'canonical text: nothing applied');
});

test('parseText with alternations: one rule for the canonical frame reads its variants', () => {
  const w = new World(); w.tell(RULES);
  w.tell(`@r1 g.rule lhs=S rhs=V rhs=NP  @r2 g.rule lhs=NP rhs=Det rhs=N  @d g.word text=the lemma=the cat=Det  @v g.word text=open lemma=open cat=V  @n g.word text=door lemma=door cat=N`);
  const plain = parseText(w, 'could you open the door');
  const alt = parseText(w, 'could you open the door', { alternations: true });
  assert.equal(plain.length, 0, 'without alternations the variant does not parse');
  assert.ok(alt.length > 0 && alt.applied.includes('could_you'), 'with them it does');
});
