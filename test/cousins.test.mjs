// Cousins of a case (abstraction round item 0, owner 14:58): up along the kinds, down to other members,
// only the valid ones; and a fix judged on the case alone and on its cousins. A toy world, invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, cousins, kindChain, judgeFix, readByTypes } from '../tools/lib-under-test.mjs';

const w = new World();
w.tell(`@cow k.animal name=cow kind=bovine sound=moo legs=4  @yak k.animal name=yak kind=bovine sound=grunt legs=4  @ox k.animal name=ox kind=bovine legs=4
@sheep k.animal name=sheep kind=ovine sound=baa legs=4  @goat k.animal name=goat kind=ovine sound=bleat legs=4
@duck k.animal name=duck kind=fowl sound=quack legs=2  @hen k.animal name=hen kind=fowl sound=cluck legs=2
@bovine k.kind name=bovine is_a=ruminant  @ovine k.kind name=ovine is_a=ruminant  @fowl k.kind name=fowl is_a=bird  @ruminant k.kind name=ruminant is_a=mammal
@vs core.word text=make text=makes means=sound  @vl core.word text=have text=has means=legs`);
const O = { question: ['what', 'which', 'how', 'many', 'does'], skip: ['a', 'the', 'of'] };
const text = 'what sound does a cow make', kase = { text, frame: readByTypes(w, text, O).best };

test('cousins: siblings at degree 1, cousins further up, only the valid ones (an answer, read back to the same frame, not known)', () => {
  assert.deepEqual(kindChain(w, 'cow'), [['bovine'], ['ruminant'], ['mammal'], ['k.animal']]);
  const cs = cousins(w, kase, { degree: 4, read: O, known: ['what sound does a goat make'] });
  const valid = (d) => cs.filter((c) => c.valid && c.degree === d && c.dims[0] !== 'key').map((c) => c.frame.of.id).sort();
  assert.deepEqual(valid(1), ['yak'], 'siblings: the other bovines');
  assert.deepEqual(valid(2), ['sheep'], 'first cousins: other ruminants; the goat is a known case');
  assert.deepEqual(valid(4), ['duck', 'hen'], 'distant: other animals');
  assert.equal(cs.find((c) => c.frame.of?.id === 'ox').why, 'no answer in the world');
  assert.ok(cs.some((c) => c.valid && c.dims[0] === 'key' && c.frame.key === 'legs'), 'along the key: another aspect of the same holder');
});

test('judgeFix: a point fix passes the case and fails its cousins; a general reading passes both', () => {
  const cs = cousins(w, kase, { degree: 4, read: O });
  const point = (t) => (t === text ? ['moo'] : null); // a fix for the case alone
  const general = (t) => readByTypes(w, t, O).best?.answer;
  const p = judgeFix(point, kase, cs), g = judgeFix(general, kase, cs);
  assert.equal(p.case, true); assert.equal(p.share, 0);
  assert.equal(g.case, true); assert.equal(g.share, 1);
  assert.deepEqual(Object.keys(g.byDegree).sort(), ['1', '2', '4']);
});

test('cousins over a layered graph: several parents on several dimensions, each cousin tagged with the dimension it came by', () => {
  const v = new World();
  v.tell(`@cow k.animal name=cow kind=bovine role=farm_animal sound=moo  @yak k.animal name=yak kind=bovine role=wild sound=grunt
    @pig k.animal name=pig kind=suid role=farm_animal sound=oink  @bovine k.kind name=bovine is_a=ruminant  @suid k.kind name=suid is_a=pig_family`);
  const kase = { text: 'cow sound', frame: readByTypes(v, 'cow sound').best };
  const cs = cousins(v, kase, { degree: 2, edges: { kind: 'kind', is_a: 'kind', role: 'role' } }).filter((c) => c.valid && c.dims[0] !== 'key');
  assert.deepEqual(cs.map((c) => [c.frame.of.id, c.degree, c.dims[0]]).sort(), [['pig', 1, 'role'], ['yak', 1, 'kind']]);
});

test('cousins along the wording: the same frame in other constructions (alternation rules backwards), so a tester can say "fails when the construction changes"', async () => {
  const { normalise, alternationsOf } = await import('../tools/lib-under-test.mjs');
  const v = new World();
  v.tell(`@t core.type of=w.lang.en.alternation  @t1 core.slot of=w.lang.en.alternation key=name kind=atom kind=string
    @t2 core.slot of=w.lang.en.alternation key=from kind=atom kind=string  @t3 core.slot of=w.lang.en.alternation key=to kind=atom kind=string
    @a1 w.lang.en.alternation name=could_you from="[could|can] you {x}" to="{x}"  @a2 w.lang.en.alternation name=please from="please {x}" to="{x}"
    @cow k.animal name=cow sound=moo`);
  const kase = { text: 'tell me the sound of the cow', frame: { is: 'ask', key: 'sound', of: { id: 'cow' }, answer: ['moo'] } };
  const cs = cousins(v, kase, { dims: ['wording'], alternations: alternationsOf(v), read: { skip: ['tell', 'me', 'the', 'of'] } });
  assert.deepEqual(cs.map((c) => [c.text, c.via, c.valid]), [['could you tell me the sound of the cow', 'could_you', true], ['please tell me the sound of the cow', 'please', true]]);
  assert.ok(cs.every((c) => normalise(v, c.text).text === kase.text), 'each comes back to the case by the rules');
});
