# sopworld 0.137.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.137.0 |
| Build | e78d0d1ee301 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 999.5 kB, 291.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 997.4 kB, 291.1 kB gzipped |
| Modules bundled | 64 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.137.0'
build     // { version: '0.137.0', hash: 'e78d0d1ee301', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
