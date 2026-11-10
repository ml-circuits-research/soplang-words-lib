// Dumps, for each test of a world's tests.sop, the wires PSys2 adds for the turn and its answers, as JSONL.
import { createFsLoader, DEFAULT_ROOT } from '<PSYS2_DIR>/src/loaders/fs-loader.mjs';
import { createEngine } from '<PSYS2_DIR>/src/dialog/index.mjs';
import { serialize } from '<PSYS2_DIR>/src/soplang/index.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const out = process.argv[2]; const worlds = process.argv.slice(3);
const engine = await createEngine({ loader: createFsLoader({ roots: [DEFAULT_ROOT] }) });
const natural = (a, b) => a.localeCompare(b, 'en', { numeric: true });
for (const wid of worlds) {
  const world = engine.set.get(wid); const sessions = new Map(); const rows = []; let pass = 0;
  for (const t of [...world.tests].sort((a, b) => natural(a.id, b.id))) {
    if (t.language && t.language !== 'en') continue;
    let s = t.session ? sessions.get(t.session) : null;
    if (!s) { s = engine.createSession({ language: 'en' }); if (t.session) sessions.set(t.session, s); }
    const L = engine.set.legends; const mem = () => s.isession.memory.sessionWires(); const before = new Set(mem().map((w) => w.id));
    let reply; try { reply = await s.send(t.input, {}); } catch (e) { rows.push({ id: t.id, input: t.input, error: String(e.message) }); continue; }
    const added = mem().filter((w) => !before.has(w.id)).map((w) => ({ ...w, entries: w.entries.map((e) => ({ key: L.shortKey(w.type, e.key), value: e.value })) }));
    const last = reply.answers.at(-1); const shown = last ? last.text : reply.text;
    const ok = t.expect.every((x) => shown.includes(x)) && (!t.expectStatus || reply.statuses.at(-1) === t.expectStatus);
    if (ok) pass++;
    rows.push({ id: t.id, session: t.session ?? null, input: t.input, expect: t.expect, expectStatus: t.expectStatus ?? null, expectState: t.expectState, expectEffect: t.expectEffect,
      psys2: { passed: ok, text: reply.text, statuses: reply.statuses, answers: reply.answers.map((a) => ({ to: a.to, kind: a.kind, status: a.status, value: a.value ?? null, values: a.values ?? null, text: a.text, via: a.via ?? null, from: a.envelope?.from ?? null, reason: a.envelope?.reason ?? null, missing: a.envelope?.missing ?? null })) },
      wires: serialize(added) });
  }
  mkdirSync(out, { recursive: true }); writeFileSync(`${out}/${wid}.cases.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  console.log(wid, 'cases', rows.length, 'psys2 pass (expect+status only)', pass);
}
