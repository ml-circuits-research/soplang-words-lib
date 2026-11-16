# sopworld 0.179.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.179.0 |
| Build | c322804a3c0d |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1379.3 kB, 394.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1376.4 kB, 393.4 kB gzipped |
| Modules bundled | 74 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.179.0'
build     // { version: '0.179.0', hash: 'c322804a3c0d', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
