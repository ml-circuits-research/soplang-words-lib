# sopworld 0.230.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.230.0 |
| Build | a42f39dca165 |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1699.9 kB, 476.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1696.5 kB, 475.6 kB gzipped |
| Modules bundled | 110 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.230.0'
build     // { version: '0.230.0', hash: 'a42f39dca165', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
