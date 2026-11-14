# sopworld 0.96.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.96.0 |
| Build | 14004dfa77c7 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 820.1 kB, 236.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 818.8 kB, 236.0 kB gzipped |
| Modules bundled | 47 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.96.0'
build     // { version: '0.96.0', hash: '14004dfa77c7', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
