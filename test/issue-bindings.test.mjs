// An issue carries its rule's bindings (knowledge Q78): a language world words the reason in the user's language
// with replyFrom; the rule's `why` becomes optional English for a host that has none. A strict deny's violation
// already carries them (`vars`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

test('a soft deny\'s issue and a strict deny\'s violation carry the bindings of the rule', () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=tank key=name id=true
    @a pump feeds=$t
    @b pump feeds=$t
    @t tank name=?n
    @c core.check fn=neq args=$a args=$b
    @two core.deny when=$a when=$b when=$t if=$c soft=true why="two pumps on ?n"
    @t1 tank name=north
  `);
  assert.equal(w.tell('@p1 pump feeds=$t1\n@p2 pump feeds=$t1').ok, true);
  const issue = w.check().issues.find((i) => i.rule === 'two');
  assert.equal(issue.why, 'two pumps on north');
  assert.equal(issue.bindings.n, 'north', 'the bindings as data');
  const s = new World();
  s.load('@k core.slot of=tank key=name id=true\n@a tank name=?n level=?l\n@lim core.check fn=lt args=?l args=0\n@d core.deny when=$a if=$lim why="?n is below 0"');
  const r = s.tell('@t tank name=south level=-1');
  assert.deepEqual([r.ok, r.violations[0].vars.n, r.violations[0].vars.l], [false, 'south', -1]);
});
