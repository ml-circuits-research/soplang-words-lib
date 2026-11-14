// std.dialogue (Round 28 item 3, from PSys2's lessons): turn kinds from the host's cue
// phrases and the world's act words; the focus log; a modal world sees a turn first; a dry
// run fork copies every context hook (tested once).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, dialogueTurn, focusLog, turn } from '../tools/lib-under-test.mjs';

const W = `@acts core.use world=std.acts
@d core.use world=std.dialogue
@c1 std.dialogue.cue kind=why text=why
@c2 std.dialogue.cue kind=correction text="no wait" text="i mean" text=actually
@c3 std.dialogue.cue kind=continuation text="and also" text=also
@v core.word text=draw means=make`;

test('dialogue: why, correction, continuation, list, ellipsis, answer, request', () => {
  const w = new World(); w.load(W);
  const last = { action: 'make', args: { kind: 'circle' } };
  const k = (s, o = {}) => dialogueTurn(w, s, { last, ...o });
  assert.deepEqual(k('why?'), { kind: 'why', rest: '?', cue: 'why', act: 'make' });
  assert.deepEqual(k('no wait, a blue one'), { kind: 'correction', rest: 'a blue one', cue: 'no wait', act: 'make' }, 'it replaces the last act');
  assert.equal(k('no wait, remove it').act, undefined, 'a correction with its own act');
  assert.deepEqual([k('and also a square').kind, k('and also a square').rest], ['continuation', 'a square']);
  assert.deepEqual(k('a square, a star and a moon'), { kind: 'list', rest: 'a square, a star and a moon', items: ['a square', 'a star', 'a moon'], act: 'make' });
  assert.deepEqual(k('a red one'), { kind: 'ellipsis', rest: 'a red one', act: 'make' });
  assert.equal(k('the blue one', { asked: true }).kind, 'answer', 'the world asked: a bare phrase answers it');
  assert.equal(k('draw a square').kind, 'request', 'an act word of the world (core.word)');
  assert.equal(dialogueTurn(w, 'a red one').kind, 'request', 'no last act: nothing to carry over');
});

test('dialogue: a modal world sees the turn first; cues from a language world mapped by type', () => {
  const w = new World(); w.load(W + '\n@m std.dialogue.modal world=quiz active=true\n@x lang.correction text=oops');
  assert.equal(dialogueTurn(w, 'a red one', { last: { action: 'make' } }).first, 'quiz');
  assert.equal(dialogueTurn(w, 'oops, a blue one', { cues: { correction: 'lang.correction' }, last: { action: 'make' } }).kind, 'correction');
  w.retract('m'); w.tell('@m std.dialogue.modal world=quiz active=false');
  assert.equal(dialogueTurn(w, 'a red one').first, undefined);
});

test('dialogue: the focus log', () => {
  const w = new World(); w.load(W);
  w.tell(`@r1 req n=1  @r2 req n=2
@t1 std.focus.turn of=$r1 in=d1  @t2 std.focus.turn of=$r2 in=d1
@m1 std.focus.mention of=$r1 kind=thing value=circle1  @m2 std.focus.mention of=$r2 kind=thing value=square1`);
  assert.deepEqual(focusLog(w, 'd1').map((t) => [t.turn, t.mentions.map((m) => m.value)]), [['r1', ['circle1']], ['r2', ['square1']]]);
});

test('fork: a dry run copies every context hook (functions, actions, producers, filters, lemma, context)', () => {
  const w = new World();
  w.register('function', 'triple', (x) => Number(x) * 3).register('action', 'ping', () => ({ ok: true })).register('producer', 'p', () => 1)
    .register('filter', 'f', (x) => x).register('lemma', (x) => [x]).register('context', 'sessionFacts', () => ['@s session user=ann']);
  const f = w.fork();
  for (const [kind, name] of [['fns', 'triple'], ['actions', 'ping'], ['producers', 'p'], ['filters', 'f'], ['context', 'sessionFacts']]) assert.equal(typeof f[kind][name], 'function', `${kind}.${name}`);
  assert.equal(typeof f.lemma, 'function');
  assert.deepEqual(f.context.sessionFacts(), ['@s session user=ann']);
  w.load('@acts core.use world=std.acts  @x std.schema.world name=x  @t core.type of=box extends=std.schema.thing  @k std.schema.kind of=box world=x acts=make');
  assert.equal(turn(w, [{ action: 'make', args: { kind: 'box' } }]).status, 'done', 'the dry run on a fork and the real run');
});
