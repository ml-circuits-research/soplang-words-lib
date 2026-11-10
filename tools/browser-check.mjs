#!/usr/bin/env node
// Serves docs/ and drives it in headless Chrome: the self-test, the playground and every
// page of the documentation. Needs Playwright (a development tool, not a dependency):
//   npm i -g playwright   then   npm run test:browser
// Set PLAYWRIGHT_PATH to the module and CHROME_PATH to a browser if they are not found.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const docs = resolve(dirname(fileURLToPath(import.meta.url)), '../docs');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ts': 'text/plain' };
const server = createServer(async (req, res) => {
  const path = join(docs, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'x-content-type-options': 'nosniff' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

const candidates = [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/npm-tools/node_modules/playwright/index.mjs'].filter(Boolean);
let chromium;
for (const c of candidates) {
  try { ({ chromium } = await import(c.startsWith('/') ? pathToFileURL(c).href : c)); break; } catch { /* try the next one */ }
}
if (!chromium) { console.error('Playwright was not found. Install it or set PLAYWRIGHT_PATH.'); process.exit(2); }
const chrome = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p));
const browser = await chromium.launch(chrome ? { executablePath: chrome } : {});

let failed = 0;
const check = (ok, text) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${text}`); if (!ok) failed++; };
const open = async (path) => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // resources of other hosts (web fonts) may be unreachable where this runs; only our own files count
  page.on('console', (m) => { if (m.type() === 'error' && (m.location().url || base).startsWith(base)) errors.push(m.text()); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(base)) errors.push(`failed ${r.url()}`); });
  page.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${base}/${path}`, { waitUntil: 'load' });
  return { page, errors };
};

try {
  // 1. the self-test
  {
    const { page, errors } = await open('selftest.html');
    await page.waitForSelector('#summary[data-done]', { timeout: 60000 });
    const summary = await page.textContent('#summary');
    const bad = await page.$$eval('#results li.bad', (xs) => xs.map((x) => x.textContent));
    check((await page.getAttribute('#summary', 'data-done')) === 'passed', `self-test in the browser: ${summary}`);
    for (const b of bad) console.log('     ' + b);
    check(!errors.length, `self-test page has no errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
    await page.close();
  }
  // 2. the playground
  {
    const { page, errors } = await open('playground.html');
    await page.waitForFunction(() => window.playground && window.playground.world);
    check((await page.$$eval('#preset option', (o) => o.length)) === 7, 'playground lists the example worlds');
    await page.click('#tell');
    await page.click('#complete');
    const state = await page.textContent('#state');
    check(/@m1 meeting people=9 room=\$big time=14:00 duration=30/.test(state), 'playground: tell + complete fills the meeting');
    check(/core\.via=\$confirm/.test(state), 'playground: derived wires show their rule');
    await page.fill('#facts', '@m2 meeting people=3');
    await page.click('#tell');
    const options = await page.$$eval('#open li button', (b) => b.map((x) => x.textContent));
    check(options.includes('10:00') && options.includes('14:00'), `playground: the open question offers its options (${options.join(', ')})`);
    await page.click('#open li button >> text=10:00');
    check(/@m2 meeting people=3 .*time=10:00/.test(await page.textContent('#state')), 'playground: clicking an option answers the question');
    await page.fill('#facts', '@m3 meeting people=20 room=$big');
    await page.click('#tell');
    check(/room too small/.test(await page.textContent('#log .entry.bad pre')), 'playground: a refusal is shown with its reason');
    await page.selectOption('#preset', 'garden');
    await page.click('#abduce');
    const log = await page.textContent('#log');
    check(/rain place=lawn/.test(log) && /sprinkler place=lawn/.test(log), 'playground: abduction lists both explanations');
    await page.selectOption('#preset', 'scheduling');
    await page.click('#tell');
    await page.click('#solve');
    check(/solve: sat/.test(await page.textContent('#log')), 'playground: the solver finds a schedule in the browser');
    await page.selectOption('#solver', 'backtrack');
    check(/solver backtrack/.test(await page.textContent('#status')), 'playground: the solver strategy can be switched');
    check(!errors.length, `playground has no errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
    await page.close();
  }
  // 3. every page loads, and every local link resolves
  {
    const pages = ['index.html', 'concepts.html', 'matrix.html', 'reasoning.html', 'usecases.html', 'solvers.html', 'api.html', 'playground.html', 'roadmap.html', 'selftest.html'];
    const links = new Set();
    for (const p of pages) {
      const { page, errors } = await open(p);
      const title = await page.title();
      for (const h of await page.$$eval('a[href]', (a) => a.map((x) => x.getAttribute('href')))) if (!/^(https?:|#|mailto:)/.test(h)) links.add(h.split('#')[0]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      check(!errors.length && /sopworld/.test(title) && !overflow, `${p} loads (${title})${errors.length ? ': ' + errors.join(' | ') : ''}${overflow ? ': the page scrolls sideways' : ''}`);
      await page.close();
    }
    const missing = [...links].filter((l) => l && !existsSync(join(docs, l)));
    check(!missing.length, `all ${links.size} local links resolve${missing.length ? ': missing ' + missing.join(', ') : ''}`);
  }
  // 4. phone width
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
    for (const p of ['index.html', 'playground.html', 'solvers.html']) {
      await page.goto(`${base}/${p}`, { waitUntil: 'load' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      check(!overflow, `${p} fits a 390 px wide screen`);
    }
    await page.screenshot({ path: '/tmp/sopworld-playground-phone.png' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/playground.html`, { waitUntil: 'load' });
    await page.screenshot({ path: '/tmp/sopworld-playground.png' });
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(failed ? `${failed} check(s) failed` : 'all browser checks passed');
process.exit(failed ? 1 : 0);
