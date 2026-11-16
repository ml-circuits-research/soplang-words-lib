# sopworld 0.174.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.174.0 |
| Build | 5f5d0313b8da |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1355.8 kB, 388.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1353.0 kB, 387.7 kB gzipped |
| Modules bundled | 71 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.174.0'
build     // { version: '0.174.0', hash: '5f5d0313b8da', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
