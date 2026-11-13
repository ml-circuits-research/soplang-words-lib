// Why-answers (Round 19, item 4): for a wire or one of its values, the chain that produced
// it, in one stable structure a host turns into a sentence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { makeWorld } from '../examples/fill.mjs';

const brief = (r) => r.steps.map((s) => [s.id.startsWith('_') ? s.id.split('_')[1] : s.id, s.key ?? null, s.how, s.rule ?? s.action ?? null]);

test('why: a value chosen by std.fill says its tier and source, the rule that chose it, and goes back to what was told', () => {
  const w = makeWorld();
  w.tell('@u1 know.usual thing=cup key=place value=table  @q1 draw.request thing=cup');
  const need = w.ofType('std.fill.need').find((n) => n.attrs.key[0] === 'place');
  const r = w.why(need.id);
  assert.deepEqual(r.steps[0].choice, { key: 'place', value: 'table', tier: 'knowledge', source: 'know' });
  assert.deepEqual(brief(r), [
    ['need.place', 'value', 'rule', 'std.fill.choose'],
    ['need.place', null, 'rule', 'ask.place'], // the need: the request left out its place
    ['q1', null, 'told', null],
    ['std.fill.bs', null, 'aggregate', 'std.fill.low'],
    ['std.fill.at', null, 'aggregate', 'std.fill.cnt'],
    ['o.know', null, 'rule', 'r.know'], // the offer chosen, and what it came from
    ['u1', null, 'told', null],
  ]);
  assert.deepEqual(w.why(need.id), r, 'stable');
  // the default tier, when nothing better is known
  const size = w.ofType('std.fill.need').find((n) => n.attrs.key[0] === 'size');
  assert.deepEqual(w.why(size.id).steps[0].choice, { key: 'size', value: 'medium', tier: 'default', source: 'draw' });
});

test('why: a computed value, a slot default, an open key, a value an action set, a wire an action told', () => {
  const w = new World({ actions: { open: ({ tell }, { game }) => { tell(`@g1 game name=${game} state=running`); return true; } } });
  w.load(String.raw`
@k1 core.slot of=thing key=name id=true
@k2 core.slot of=thing key=size default=small
@k3 core.slot of=thing key=colour required=true
@b thing name=?n h=?h
@c core.calc out=?y fn=sub args=100 args=?h
@t thing core.on=$b y=?y
@r core.rule when=$b with=$c then=$t
@it thing name=?x
@to thing core.on=$it place=?q
@move core.action name=move param=x param=q when=$it set=$to
@open core.action name=open fn=open required=game
`);
  w.tell('@a thing name=cup h=90');
  w.complete({ defaults: true });
  w.act({ action: 'move', args: { x: 'cup', q: 'shelf' } });
  w.act({ action: 'open', args: { game: 'chess' } });
  const step = (id, k) => { const s = w.why(id, k).steps[0]; return [s.how, s.value ?? null, s.rule ?? s.action ?? null, s.from ?? null]; };
  assert.deepEqual(step('a', 'y'), ['rule', '10', 'r', ['a']], 'why is it so low: the rule, from the thing (h=90)');
  assert.deepEqual(step('a', 'h'), ['told', '90', null, null]);
  assert.deepEqual(step('a', 'size'), ['default', 'small', null, null]);
  assert.deepEqual(step('a', 'colour'), ['open', null, null, null]);
  assert.deepEqual(step('a', 'place'), ['action', 'shelf', 'move', null]);
  assert.deepEqual(step('g1'), ['action', null, 'open', null], 'why did you open chess: the action that told it');
  assert.equal(w.why('nobody'), null);
});
