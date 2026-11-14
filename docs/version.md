# sopworld 0.116.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.116.0 |
| Build | 60c45ab87446 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 917.2 kB, 265.8 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 915.3 kB, 265.4 kB gzipped |
| Modules bundled | 54 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.116.0'
build     // { version: '0.116.0', hash: '60c45ab87446', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
