// Tools for authors (Round 24, A6): the failure ledger (append-only, grouped by pipeline
// stage, class and the host's cause signals) and validating a world in one command.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { World, ledgerAppend, ledgerGroups, stageOf, turn } from '../tools/lib-under-test.mjs';
import { seating } from '../examples/acts.mjs';

const row = (text, source, extra = {}) => ({ text, source, world: 'draw', happened: 'no reply', expected: 'a cup', stage: 'reading', class: 'miss', ...extra });

test('ledger: append-only, no duplicates; groups by stage, class and the first signal that holds, examples spread over sources', () => {
  const old = [row('draw a cup', 'logs')];
  const add = ledgerAppend(old, [row('draw a cup', 'logs', { happened: 'changed' }), row('draw a cup', 'pairs'), row('paint a mug', 'logs')]);
  assert.deepEqual(add.map((r) => [r.text, r.source]), [['draw a cup', 'pairs'], ['paint a mug', 'logs']], 'the old row is not rewritten nor added again');
  const rows = [...old, ...add, row('a red one', 'dialogues', { stage: 'filling' }), row('make it big', 'logs', { stage: 'filling' }), row('remove eyeglasses', 'logs', { stage: 'routing', class: 'kind' })];
  const signals = [['a word for a cup', (r) => /cup|mug/.test(r.text)], ['a continuation', (r) => /one$|it/.test(r.text)]];
  const g = ledgerGroups(rows, { signals, examples: 2 });
  assert.deepEqual(g.map((x) => [x.key, x.count]), [['reading / miss / a word for a cup', 3], ['filling / miss / a continuation', 2], ['routing / kind / other', 1]]);
  assert.deepEqual(g[0].examples.map((e) => e.source), ['logs', 'pairs'], 'spread over sources');
  assert.deepEqual(ledgerGroups(rows, { signals }), ledgerGroups([...rows], { signals }), 'stable');
});

test('ledger: the stage of a turn that failed', () => {
  const w = new World();
  w.load(['@acts core.use world=std.acts', seating].join('\n'));
  w.act({ action: 'make', args: { kind: 'seat' } });
  assert.deepEqual([
    stageOf(turn(w, [])), stageOf(turn(w, [{ action: 'make', args: { kind: 'hat' } }])), stageOf(turn(w, [{ action: 'change', args: { thing: 'seat' } }])),
    stageOf(turn(w, [{ action: 'change', args: { thing: 'seat', attr: 'size', value: 1 } }])), stageOf(turn(w, [{ action: 'make', args: { kind: 'guest', name: 'Ana' } }])),
  ], ['reading', 'routing', 'filling', 'acting', null]); // a seat with no size here is the act's: no world has it
});

test('tools: ledger add / report on disk; validate a world in one command', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-'));
  const L = join(dir, 'l.jsonl'), R = join(dir, 'r.jsonl');
  writeFileSync(R, [row('draw a cup', 'logs'), row('draw a cup', 'logs')].map((r) => JSON.stringify(r)).join('\n'));
  assert.match(execFileSync(process.execPath, ['tools/ledger.mjs', 'add', L, R], { encoding: 'utf8' }), /1 rows added/);
  assert.match(execFileSync(process.execPath, ['tools/ledger.mjs', 'add', L, R], { encoding: 'utf8' }), /0 rows added/);
  assert.match(execFileSync(process.execPath, ['tools/ledger.mjs', 'report', L], { encoding: 'utf8' }), /\| 1 \| reading \| miss \| other \| draw a cup \(logs\) \|/);
  assert.match(execFileSync(process.execPath, ['tools/validate.mjs', 'examples/acts.mjs'], { encoding: 'utf8' }), /ok: .* 0 refused, 1 notes, 0 grid holes/);
  writeFileSync(join(dir, 'bad.sop'), '@k core.slot of=a key=n kind=number\n@x a n=lots');
  const bad = spawnSync(process.execPath, ['tools/validate.mjs', join(dir, 'bad.sop')], { encoding: 'utf8' });
  assert.deepEqual([bad.status, /refused: domain/.test(bad.stdout)], [1, true]);
});
