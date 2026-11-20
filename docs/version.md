# sopworld 0.231.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.231.1 |
| Build | 510a782e2ce0 |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1703.7 kB, 477.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1700.3 kB, 476.8 kB gzipped |
| Modules bundled | 110 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.231.1'
build     // { version: '0.231.1', hash: '510a782e2ce0', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
