# sopworld 0.234.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.234.0 |
| Build | 387c56d75023 |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1714.3 kB, 480.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1710.9 kB, 480.1 kB gzipped |
| Modules bundled | 110 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.234.0'
build     // { version: '0.234.0', hash: '387c56d75023', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
