#!/usr/bin/env node
// Checks the browser Z3 provider (docs/smt-z3.mjs) in headless Chromium over the DevTools protocol, with no
// other tool: run `npm run test:browser-z3` (CHROME_PATH picks the browser). It serves docs/ twice:
//   isolated   COOP same-origin + COEP require-corp, as a host that serves those headers (or a service worker) does
//   plain      no isolation headers, CORS '*', max-age=600: what GitHub Pages serves
// and checks, with timings:
//   - importing the provider fetches nothing from docs/vendor/ (Z3 is loaded only by the first problem);
//   - on the isolated page Z3 solves a placement, proves an impossible one with the conflict named, in the
//     page and in a module worker, also with the Z3 files taken from the other (plain) origin;
//   - on the plain page the provider declines and the internal search answers (provider=internal).

import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, resolve, dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const docs = resolve(dirname(fileURLToPath(import.meta.url)), '../docs');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.gz': 'application/gzip', '.md': 'text/plain' };
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const scene = `@p std.problem.request budget=5000 var=$vx var=$vy box=$page box=$house box=$tree box=$lake constraint=$c1 constraint=$c2 constraint=$c3 constraint=$c4
@vx std.problem.var name=x min=0 max=700 step=10
@vy std.problem.var name=y min=0 max=520 step=10
@page std.problem.box name=page x=0 y=0 w=800 h=600
@house std.problem.box name=house x=x y=y w=100 h=80
@tree std.problem.box name=tree x=420 y=200 w=60 h=120
@lake std.problem.box name=lake x=100 y=380 w=260 h=140
@c1 std.problem.constraint name=on_page predicate=inside a=house b=page
@c2 std.problem.constraint name=near_tree predicate=near a=house b=tree gap=40
@c3 std.problem.constraint name=avoid_lake predicate=apart a=house b=lake
@c4 std.problem.constraint name=low predicate=maximise a=y strength=soft weight=1`;
const impossible = scene.replace('constraint=$c4', 'constraint=$c4 constraint=$c5') + '\n@c5 std.problem.constraint name=inside_lake predicate=inside a=house b=lake';

// The probe runs in the page or in a module worker; it reports what it saw.
const probe = `import { solveProblem, parse } from './sopworld.mjs';
import { z3Provider, z3Supported } from './smt-z3.mjs';
const summary = (text) => { const rows = parse(text), m = rows.find((r) => r.type === 'std.problem.result'); return { status: m.attrs.status[0], provider: m.attrs.provider?.[0], conflict: m.attrs.conflict ?? [] }; };
export async function probe({ base } = {}) {
  const out = { isolated: globalThis.crossOriginIsolated === true, supported: z3Supported() };
  let load; const provider = z3Provider({ base: base ?? undefined, onLoad: (i) => { load = i; } });
  let t = performance.now(); out.solved = summary(await solveProblem(${JSON.stringify(scene)}, { provider })); out.firstMs = Math.round(performance.now() - t); out.load = load;
  t = performance.now(); summary(await solveProblem(${JSON.stringify(scene)}, { provider })); out.againMs = Math.round(performance.now() - t);
  t = performance.now(); out.impossible = summary(await solveProblem(${JSON.stringify(impossible)}, { provider })); out.impossibleMs = Math.round(performance.now() - t);
  return out;
}
self.onmessage = async (e) => self.postMessage(await probe(e.data).catch((x) => ({ error: String(x) })));
`;
const page = `<!doctype html><meta charset="utf-8"><title>z3 check</title><script type="module">
const q = new URLSearchParams(location.search), base = q.get('base');
await new Promise((r) => setTimeout(r, 300));   // the vendor log is read here: nothing may be fetched before a problem
window.beforeProblem = true;
window.result = (q.has('worker') ? new Promise((resolve) => { const w = new Worker('./__z3-probe.mjs', { type: 'module' }); w.onmessage = (e) => resolve(e.data); w.onerror = (e) => resolve({ error: e.message }); w.postMessage({ base }); })
  : import('./__z3-probe.mjs').then((m) => m.probe({ base }))).catch((e) => ({ error: String(e) }));
</script>`;

const log = [];
const serve = (isolated) => createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const headers = { 'Cache-Control': 'max-age=600', 'Access-Control-Allow-Origin': '*' };
  if (isolated) Object.assign(headers, { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' });
  const body = path === '/__z3-check.html' ? page : path === '/__z3-probe.mjs' ? probe : await readFile(join(docs, path)).catch(() => null);
  if (body === null) { res.writeHead(404); res.end(); return; }
  log.push({ isolated, path });
  res.writeHead(200, { ...headers, 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' }); res.end(body);
});
const servers = [serve(true), serve(false)];
for (const s of servers) await new Promise((r) => s.listen(0, '127.0.0.1', r));
const [isoUrl, plainUrl] = servers.map((s, i) => `http://${i ? 'localhost' : '127.0.0.1'}:${s.address().port}`);

const chrome = [process.env.CHROME_PATH, '/usr/bin/chromium', '/usr/bin/google-chrome'].find((p) => p && existsSync(p));
if (!chrome) { console.error('No Chromium found; set CHROME_PATH.'); process.exit(2); }
const profile = await mkdtemp(join(tmpdir(), 'sopworld-z3-'));
const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--password-store=basic', '--no-first-run', '--disable-extensions', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
let failed = 0;
const check = (ok, text) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${text}`); if (!ok) failed++; };
try {
  let port;
  for (let i = 0; i < 200 && !port; i++) { try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch { await delay(100); } }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { socket.addEventListener('open', r, { once: true }); socket.addEventListener('error', j, { once: true }); });
  let seq = 0; const pending = new Map();
  socket.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const call = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const m = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); return m.result?.result?.value; };
  const run = async (url) => {
    log.length = 0;
    const started = Date.now();
    await call('Page.navigate', { url });
    for (let i = 0; i < 100 && !(await evaluate('window.beforeProblem === true').catch(() => false)); i++) await delay(50);
    const early = log.filter((l) => l.path.includes('/vendor/')).length;
    let result;
    for (let i = 0; i < 600 && !result; i++) { await delay(100); result = await evaluate('window.result ? window.result.then((r) => JSON.stringify(r)) : null').catch(() => null); }
    return { ...JSON.parse(result ?? '{"error":"no result"}'), early, vendor: log.filter((l) => l.path.includes('/vendor/')).length, wallMs: Date.now() - started };
  };
  const z3Ok = (r, what) => {
    check(r.early === 0, `${what}: nothing fetched from docs/vendor/ before the first problem`);
    check(r.isolated && r.solved?.status === 'solved' && r.solved.provider === 'z3', `${what}: Z3 solves the placement (load ${r.load?.ms} ms, first solve ${r.firstMs} ms, again ${r.againMs} ms)`);
    check(r.impossible?.status === 'unsatisfiable' && r.impossible.conflict.includes('inside_lake'), `${what}: Z3 proves the impossible request, conflict ${JSON.stringify(r.impossible?.conflict)} (${r.impossibleMs} ms)`);
    if (r.error) console.log('     error:', r.error);
  };
  const crossBase = encodeURIComponent(`${plainUrl}/vendor/`);
  z3Ok(await run(`${isoUrl}/__z3-check.html`), 'isolated page');
  z3Ok(await run(`${isoUrl}/__z3-check.html?worker=1`), 'isolated page, module worker');
  const versioned = (await readFile(join(docs, 'smt-z3.mjs'), 'utf8')).match(/z3Version = '([^']+)'/)[1];
  z3Ok(await run(`${isoUrl}/__z3-check.html?worker=1&base=${crossBase}z3-solver-${versioned}/`), 'isolated page, Z3 files from another origin');
  const plain = await run(`${plainUrl}/__z3-check.html`);
  check(!plain.isolated && !plain.supported && plain.solved?.provider === 'internal' && plain.solved.status === 'solved' && plain.vendor === 0,
    `plain page: the provider declines without fetching Z3 and the internal search answers (${plain.solved?.provider}, ${plain.solved?.status})`);
  socket.close();
} finally {
  child.kill('SIGKILL');
  for (const s of servers) s.close();
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
console.log(failed ? `${failed} check(s) failed` : 'all browser Z3 checks passed');
process.exit(failed ? 1 : 0);
