// The slowest tests of a plain run, with their seconds (reviewer 23:45: a test over 10 s gets a smaller
// fixture or moves to test:full). node tools/slowest-tests.mjs [n]
import { execFileSync } from 'node:child_process';
const n = Number(process.argv[2] ?? 10);
let out = '';
try { out = execFileSync('node', ['--test', '--test-reporter=tap'], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { out = e.stdout ?? ''; }
const lines = out.split('\n'), rows = [];
lines.forEach((l, i) => { const m = /^(ok|not ok) \d+ - (.*)/.exec(l); if (!m) return; for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) { const d = /duration_ms: ([\d.]+)/.exec(lines[j]); if (d) { rows.push([Number(d[1]) / 1000, m[2]]); break; } } });
rows.sort((a, b) => b[0] - a[0]);
const total = /# duration_ms ([\d.]+)/.exec(out);
console.log(`plain run: ${total ? (Number(total[1]) / 1000).toFixed(1) : '?'} s wall, ${rows.length} tests`);
for (const [s, name] of rows.slice(0, n)) console.log(`${s.toFixed(1).padStart(6)} s  ${name.slice(0, 110)}`);
const over = rows.filter(([s]) => s > 10);
if (over.length) { console.log(`${over.length} over 10 s`); process.exitCode = 1; }
