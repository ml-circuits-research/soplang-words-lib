# sopworld 0.173.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.173.0 |
| Build | 9fd7ad2163b7 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1350.6 kB, 387.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1347.7 kB, 386.8 kB gzipped |
| Modules bundled | 71 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.173.0'
build     // { version: '0.173.0', hash: '9fd7ad2163b7', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
