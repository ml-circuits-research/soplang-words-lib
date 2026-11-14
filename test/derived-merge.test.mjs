// The tier of a derived value survives a merge (reviewer 08:45, from the knowledge
// repository's Q42): a fact a rule derived, shipped as data (`derived=true core.source="rule
// <id>"`), merged with a told fact of the same identity, keeps the origin of each value.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

for (const order of ['derived first', 'told first']) {
  test(`a derived value and a told value on one identity keep their own tiers (${order}); why names the rule`, () => {
    const w = new World();
    w.tell('@s core.slot of=k.animal key=name id=true');
    const derived = '@d k.animal name=trout lives=water derived=true core.source="rule k.animal.inherit"';
    const told = '@t k.animal name=trout colour=brown core.source="hand 1"';
    for (const x of order === 'derived first' ? [derived, told] : [told, derived]) assert.ok(w.tell(x).ok);
    const id = w.ofType('k.animal')[0].id;
    assert.equal(w.ofType('k.animal').length, 1, 'one wire');
    assert.deepEqual([w.tier(id, 'lives'), w.tier(id, 'colour'), w.tier(id, 'name')], ['derived', 'told', 'told']);
    const step = w.why(id, 'lives').steps[0];
    assert.deepEqual([step.how, step.rule, step.tier], ['rule', 'k.animal.inherit', 'derived']);
    assert.equal(w.why(id, 'colour').steps[0].how, 'told');
  });
}
