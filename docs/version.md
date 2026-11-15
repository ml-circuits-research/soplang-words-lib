# sopworld 0.133.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.133.0 |
| Build | 9922243f3f31 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 974.7 kB, 284.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 972.6 kB, 283.7 kB gzipped |
| Modules bundled | 63 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.133.0'
build     // { version: '0.133.0', hash: '9922243f3f31', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
