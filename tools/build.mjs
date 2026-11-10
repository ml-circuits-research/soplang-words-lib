#!/usr/bin/env node
// Builds the single-file library from src/ without any dependency.
//
//   docs/sopworld.mjs   ES module:   import { World } from './sopworld.mjs'
//   docs/sopworld.js    classic script and CommonJS:   <script src="sopworld.js"> gives
//                       the global `sopworld`;   const sopworld = require('./sopworld.js')
//   docs/sopworld.d.ts  type declarations
//   docs/worlds.mjs, docs/scheduling.mjs   the demonstration worlds used by the playground
//
// Each source module becomes one function scope, so names never collide. The bundler
// understands exactly the import and export forms used in src/ and stops on any other.

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { dirname, resolve, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = resolve(root, 'src/index.mjs');
const out = resolve(root, 'docs');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const IMPORT = /^import\s*\{([^}]*)\}\s*from\s*'(\.[^']+)';[ \t]*\n/gm;
const REEXPORT = /^export\s*\{([^}]*)\}\s*from\s*'(\.[^']+)';[ \t]*\n/gm;
const DECL = /^export\s+((?:async\s+)?function\*?|class|const|let)\s+([A-Za-z_$][\w$]*)/gm;
const names = (list) => list.split(',').map((s) => s.trim()).filter(Boolean);
const fail = (file, why) => { throw new Error(`build: ${relative(root, file)}: ${why}`); };

const modules = new Map(); // path -> { id, body, imports, exports, reexports }
const order = [];

function load(file, stack = []) {
  if (modules.has(file)) {
    if (!modules.get(file).done) fail(file, `import cycle: ${[...stack, file].map((f) => basename(f)).join(' -> ')}`);
    return modules.get(file);
  }
  const mod = { id: `__${basename(file, '.mjs').replace(/\W/g, '_')}`, imports: [], exports: [], reexports: [], done: false };
  modules.set(file, mod);
  let src = readFileSync(file, 'utf8');
  src = src.replace(IMPORT, (_, list, from) => {
    for (const n of names(list)) if (/\sas\s/.test(n)) fail(file, `"import { ${n} }" renames a binding`);
    mod.imports.push({ names: names(list), file: resolve(dirname(file), from) });
    return '';
  });
  src = src.replace(REEXPORT, (_, list, from) => {
    for (const n of names(list)) if (/\sas\s/.test(n)) fail(file, `"export { ${n} }" renames a binding`);
    mod.reexports.push({ names: names(list), file: resolve(dirname(file), from) });
    return '';
  });
  src = src.replace(DECL, (_, kind, name) => { mod.exports.push(name); return `${kind} ${name}`; });
  const left = src.match(/^(import|export)\b.*$/m);
  if (left) fail(file, `unsupported statement: ${left[0]}`);
  if (/\b(require\s*\(|process\.|__dirname|node:)/.test(src.replace(/\/\/.*$/gm, ''))) fail(file, 'uses a Node-only API; the bundle must run in a browser');
  mod.body = src.trim();
  for (const dep of [...mod.imports, ...mod.reexports]) load(dep.file, [...stack, file]);
  mod.done = true;
  order.push(file);
  return mod;
}

load(entry);
const index = modules.get(entry);
const version = /export const version = '([^']+)'/.exec(readFileSync(entry, 'utf8'))?.[1];
if (version !== pkg.version) throw new Error(`build: src/index.mjs says version ${version}, package.json says ${pkg.version}`);

const indent = (text) => text.split('\n').map((l) => (l ? '  ' + l : l)).join('\n');
const parts = [];
for (const file of order) {
  const m = modules.get(file);
  const head = m.imports.map((i) => `const { ${i.names.join(', ')} } = ${modules.get(i.file).id};`);
  const exported = [...m.exports, ...m.reexports.flatMap((r) => r.names.map((n) => `${n}: ${modules.get(r.file).id}.${n}`))];
  parts.push(`// ---- ${relative(root, file)}\nconst ${m.id} = (() => {\n${indent([...head, m.body].filter(Boolean).join('\n'))}\n  return { ${exported.join(', ')} };\n})();`);
}
const publicNames = [...index.exports, ...index.reexports.flatMap((r) => r.names)].sort();
// The build knows what it is: a fingerprint of the bundled sources, and the day that
// fingerprint was first built (kept from docs/version.md, so rebuilding the same
// sources gives the same files).
const BUILD_LINE = 'const build = { version, hash: null, date: null };';
const raw = parts.join('\n\n');
if (!raw.includes(BUILD_LINE)) throw new Error('build: src/index.mjs must declare `export const build = { version, hash: null, date: null };`');
const hash = createHash('sha256').update(raw).digest('hex').slice(0, 12);
const versionFile = resolve(out, 'version.md');
const previous = existsSync(versionFile) ? readFileSync(versionFile, 'utf8') : '';
const date = previous.includes(`| ${hash} |`) ? /\| Built \| (\d{4}-\d{2}-\d{2}) \|/.exec(previous)[1] : new Date().toISOString().slice(0, 10);
const body = raw.replace(BUILD_LINE, `const build = { version, hash: '${hash}', date: '${date}' };`);
const banner = `// sopworld ${pkg.version} (build ${hash}, ${date}) - consistency matrices for SOP Lang circuits.\n// Single-file build of src/, generated by tools/build.mjs. Do not edit; edit src/ and rebuild.\n// Runs in Node 18+ and in browsers. No dependencies. License: ${pkg.license}.\n`;

const esm = `${banner}\n${body}\n\nexport const { ${publicNames.join(', ')} } = ${index.id};\nexport default ${index.id};\n`;
const umd = `${banner}\nvar sopworld = (function () {\n'use strict';\n${body}\n\nreturn ${index.id};\n})();\nif (typeof module === 'object' && module.exports) module.exports = sopworld;\n`;

mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'sopworld.mjs'), esm);
writeFileSync(resolve(out, 'sopworld.js'), umd);
copyFileSync(resolve(root, 'src/index.d.ts'), resolve(out, 'sopworld.d.ts'));
copyFileSync(resolve(root, 'examples/worlds.mjs'), resolve(out, 'worlds.mjs'));
copyFileSync(resolve(root, 'examples/scheduling.mjs'), resolve(out, 'scheduling.mjs'));
writeFileSync(resolve(out, '.nojekyll'), '');
// docs/*.js are classic scripts; this keeps Node from reading them as ES modules
writeFileSync(resolve(out, 'package.json'), JSON.stringify({ type: 'commonjs', private: true }, null, 2) + '\n');

const kb = (n) => (n / 1024).toFixed(1) + ' kB';
writeFileSync(versionFile, `# sopworld ${pkg.version}

The single-file build in this folder.

| | |
| --- | --- |
| Version | ${pkg.version} |
| Build | ${hash} |
| Built | ${date} |
| \`sopworld.mjs\` (ES module) | ${kb(Buffer.byteLength(esm))}, ${kb(gzipSync(esm).length)} gzipped |
| \`sopworld.js\` (global \`sopworld\`, CommonJS) | ${kb(Buffer.byteLength(umd))}, ${kb(gzipSync(umd).length)} gzipped |
| Modules bundled | ${order.length} |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

\`\`\`js
import { version, build } from './sopworld.mjs';
version   // '${pkg.version}'
build     // { version: '${pkg.version}', hash: '${hash}', date: '${date}' }
\`\`\`

In a page that loads \`sopworld.js\` it is \`sopworld.version\` and \`sopworld.build\`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
`);
console.log(`sopworld ${pkg.version} (build ${hash}, ${date}): ${order.length} modules, ${publicNames.length} exports`);
for (const [name, text] of [['docs/sopworld.mjs', esm], ['docs/sopworld.js', umd]]) {
  console.log(`  ${name.padEnd(18)} ${kb(Buffer.byteLength(text)).padStart(9)}   gzip ${kb(gzipSync(text).length)}`);
}
