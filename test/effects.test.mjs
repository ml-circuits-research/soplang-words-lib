// Domain effects (Round 26, A3 and A5): an act on a kind whose state is not wires is given
// to the host; its difference comes back with the act; a refused sentence undoes it too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const make = () => {
  const board = [];
  const w = new World({ actions: {
    board_make: (ctx, args) => { const id = `shape${board.length + 1}`; board.push({ id, kind: args.kind, colour: args.colour ?? 'black' }); return { thing: id, diff: { added: [id] }, undo: () => board.splice(board.findIndex((x) => x.id === id), 1) }; },
    board_change: (ctx, args) => { const s = board.find((x) => x.id === args.thing); if (!s) return { ok: false, why: `there is no ${args.thing} on the board` }; const from = s[args.attr]; s[args.attr] = args.value; return { thing: s.id, diff: { changed: [{ id: s.id, key: args.attr, from, to: args.value }] }, undo: () => { s[args.attr] = from; } }; },
  } });
  w.load(String.raw`@acts core.use world=std.acts
@b std.schema.world name=board
@t core.type of=circle extends=std.schema.thing
@k std.schema.kind of=circle world=board acts=make acts=change
@e1 std.schema.effect of=circle act=make action=board_make
@e2 std.schema.effect of=circle act=change action=board_change`);
  return { w, board };
};

test('effects: an act on a kind with an effect is the host\'s; its difference comes back with the act', () => {
  const { w, board } = make();
  const r = w.act({ action: 'make', args: { kind: 'circle', colour: 'red' } });
  assert.deepEqual([r.ok, r.result.effect, r.result.thing, r.diff.effects, r.diff.same], [true, 'board_make', 'shape1', [{ added: ['shape1'] }], false]);
  assert.deepEqual(board, [{ id: 'shape1', kind: 'circle', colour: 'red' }]);
  assert.equal(w.ofType('circle').length, 0, 'no wire: the state is the host\'s');
  const c = w.act({ action: 'change', args: { kind: 'circle', thing: 'shape1', attr: 'colour', value: 'blue' } });
  assert.deepEqual(c.diff.effects, [{ changed: [{ id: 'shape1', key: 'colour', from: 'red', to: 'blue' }] }]);
  assert.equal(w.act({ action: 'change', args: { kind: 'circle', thing: 'shape9', attr: 'colour', value: 'blue' } }).violations[0].why, 'there is no shape9 on the board');
});

test('effects: a refused sentence undoes the effects done before the refusal (all or nothing includes effects)', () => {
  const { w, board } = make();
  const g = w.act([{ action: 'make', args: { kind: 'circle' } }, { action: 'make', args: { kind: 'circle' } }, { action: 'make', args: { kind: 'hat' } }]);
  assert.deepEqual([g.ok, g.failed, board.length], [false, 2, 0]);
  assert.equal(w.act([{ action: 'make', args: { kind: 'circle' } }]).ok, true);
  assert.equal(board.length, 1);
});

test('replies in the host\'s words: a template per act and kind, filled from the result and the diff', async () => {
  const { actReply, turn } = await import('../tools/lib-under-test.mjs');
  const w = new World();
  w.load('@acts core.use world=std.acts\n@p std.schema.world name=plan\n@t core.type of=chair extends=std.schema.thing closed=true\n@s core.slot of=chair key=colour enum=red enum=blue default=blue\n@k std.schema.kind of=chair world=plan acts=make acts=change');
  const templates = { 'make.chair': 'Am pus un scaun ({thing}).', change: 'Am schimbat {attr} din {from} în {to}.', refused: 'Nu pot: {why}.' };
  const say = (w2, req, res) => actReply(w2, req, res, { templates });
  assert.deepEqual(turn(w, [{ action: 'make', args: { kind: 'chair' } }], { reply: say }).replies, ['Am pus un scaun (chair1).']);
  assert.deepEqual(turn(w, [{ action: 'change', args: { thing: 'chair1', attr: 'colour', value: 'red' } }], { reply: say }).replies, ['Am schimbat colour din blue în red.']);
  const req = { action: 'change', args: { thing: 'chair1', attr: 'size', value: 3 } };
  assert.equal(say(w, req, w.act(req)), 'Nu pot: a chair has no size.');
  assert.equal(actReply(w, { action: 'make', args: { kind: 'chair' } }, w.act({ action: 'make', args: { kind: 'chair' } }), { templates: {} }), 'I made a chair (chair2).', 'no template: the plain default');
});
