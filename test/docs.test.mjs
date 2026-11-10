// The documentation is checked like code: its examples are run, and what it lists is
// compared with what the library has.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkText, docFiles } from '../tools/doc-examples.mjs';

test('docs: every runnable example prints what the document shows', () => {
  let blocks = 0;
  for (const file of docFiles()) {
    const r = checkText(readFileSync(file, 'utf8'));
    blocks += r.blocks;
    assert.deepEqual(r.problems, [], file);
  }
  assert.ok(blocks >= 6, `${blocks} examples`);
  console.log(`# ${blocks} documented examples run`);
});
