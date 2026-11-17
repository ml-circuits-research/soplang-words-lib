# sopworld 0.204.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.204.0 |
| Build | 05c45919f1f0 |
| Built | 2026-11-17 |
| `sopworld.mjs` (ES module) | 1525.7 kB, 430.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1522.4 kB, 429.7 kB gzipped |
| Modules bundled | 94 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.204.0'
build     // { version: '0.204.0', hash: '05c45919f1f0', date: '2026-11-17' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
