// The coverage grid and test skeletons (Round 24, A5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { World, schemaGrid, gridTests } from '../tools/lib-under-test.mjs';
import { seating, face } from '../examples/acts.mjs';

const make = (...s) => { const w = new World(); w.load(['@acts core.use world=std.acts', ...s].join('\n')); return w; };

test('grid: every world × kind × act case run on a world with one thing of each kind; the holes are the cases not done', () => {
  const g = schemaGrid(make(seating, face));
  assert.deepEqual([g.length, g.filter((c) => !c.expect.ok).length], [35, 0]);
  assert.deepEqual(g.find((c) => c.kind === 'eye' && c.act === 'change' && c.request.args.by).expect, { ok: true, added: [], removed: 0, changed: ['size'] });
  const holes = schemaGrid(make(face.replace('max=2', 'max=1'))).filter((c) => !c.expect.ok);
  assert.deepEqual(holes.map((c) => [c.text, c.expect.why]), [['make an eye', 'at most 1 eye'], ['make a blue eye', 'at most 1 eye'], ['copy the eye', 'at most 1 eye']]);
});

test('grid: gridTests writes a node:test file that runs green against the same world', () => {
  const dir = mkdtempSync(join(tmpdir(), 'grid-'));
  const lib = new URL('../src/index.mjs', import.meta.url).pathname, ex = new URL('../examples/acts.mjs', import.meta.url).pathname;
  writeFileSync(join(dir, 'world.mjs'), `import { World } from '${lib}';\nimport { face } from '${ex}';\nexport const makeWorld = () => { const w = new World(); w.load('@acts core.use world=std.acts\\n' + face); w.act({ action: 'make', args: { kind: 'eye' } }); w.tell('@m mouth kind=mouth world=face variant=smile'); w.act({ action: 'make', args: { kind: 'glasses' } }); return w; };\n`);
  const cases = schemaGrid(make(face));
  writeFileSync(join(dir, 'grid.test.mjs'), gridTests(cases, { importFrom: './world.mjs' }));
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; // a test run of its own, not a part of this one
  const out = execFileSync(process.execPath, ['--test', '--test-reporter=tap', join(dir, 'grid.test.mjs')], { encoding: 'utf8', env });
  assert.match(out, new RegExp(`# pass ${cases.length}\\n# fail 0`));
});
