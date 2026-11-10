// Compatibility check: the wires PSys2 produced for its test dialogues (facts, events,
// questions, requests; its own answers left out) are accepted by a world that holds the
// legends, with PSys2's vocabulary. One world per session, as in PSys2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parse } from '../../tools/lib-under-test.mjs';
import { loadLegends } from './schema.test.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
export const vocabulary = { status: 'core.status' };

export function readCases(name) {
  return readFileSync(join(here, 'cases', `${name}.cases.jsonl`), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
}

function tellAll(name) {
  const sessions = new Map();
  const refused = [];
  let turns = 0;
  for (const c of readCases(name)) {
    let w = c.session ? sessions.get(c.session) : null;
    if (!w) { w = loadLegends({ vocabulary }).world; if (c.session) sessions.set(c.session, w); }
    const wires = parse(c.wires).filter((x) => x.type !== 'core.answer');
    if (!wires.length) continue;
    turns++;
    const r = w.tell(wires);
    if (!r.ok) refused.push({ id: c.id, why: [...new Set(r.violations.map((v) => `${v.kind} ${v.key} ${v.value || ''}`.trim()))] });
  }
  return { turns, refused };
}

for (const [name, expected] of [['kids.shop', 0], ['kids.tasks', 0], ['kids.arith', 4]]) {
  test(`psys2 compat: the wires of the ${name} dialogues are accepted by the legends`, () => {
    const { turns, refused } = tellAll(name);
    console.log(`# ${name}: ${turns - refused.length} of ${turns} turns accepted`);
    for (const r of refused) console.log(`#   ${r.id}: ${r.why.join('; ')}`);
    assert.equal(refused.length, expected);
    // the turns refused in kids.arith refer to an entity that is not a wire of the session:
    // $e.user, which PSys2 keeps outside it (3 turns), and $e.tom asked about before being mentioned (1)
    for (const r of refused) assert.ok(r.why.every((x) => /\$e\.(user|tom)$/.test(x)), `${r.id}: ${r.why.join('; ')}`);
  });
}
