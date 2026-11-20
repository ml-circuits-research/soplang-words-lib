# sopworld 0.247.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.247.1 |
| Build | d9dbd6e5f183 |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1817.8 kB, 509.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1814.1 kB, 508.4 kB gzipped |
| Modules bundled | 115 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.247.1'
build     // { version: '0.247.1', hash: 'd9dbd6e5f183', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
