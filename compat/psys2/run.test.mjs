// Compatibility check: the three PSys2 sample worlds, rebuilt as matrices on the library,
// give the status and value PSys2 gave for at least 95% of its test dialogues, with at
// most half the lines of the JavaScript they replace.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { run, size, WORLDS } from './run.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
for (const name of WORLDS) {
  if (!existsSync(join(here, 'matrices', name, 'matrix.sop'))) continue;
  test(`psys2 compat: ${name} as a matrix answers like PSys2`, async () => {
    const r = await run(name);
    const s = size(name);
    console.log(`# ${name}: ${r.passed} of ${r.cases} cases, ${s.matrix + s.fns} lines against ${s.ops}`);
    for (const f of r.failures) console.log(`#   ${f.id}: ${f.why.join('; ')}`);
    assert.ok(r.passed / r.cases >= 0.95, `${r.passed} of ${r.cases}`);
    assert.ok(s.matrix + s.fns <= s.ops / 2, `${s.matrix + s.fns} lines against ${s.ops}`);
  });
}
