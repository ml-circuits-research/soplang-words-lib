# sopworld 0.236.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.236.0 |
| Build | 30af59f7bd94 |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1722.6 kB, 483.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1719.2 kB, 482.6 kB gzipped |
| Modules bundled | 110 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.236.0'
build     // { version: '0.236.0', hash: '30af59f7bd94', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
