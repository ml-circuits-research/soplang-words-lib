# sopworld 0.183.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.183.0 |
| Build | 8295f9e0365d |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1394.5 kB, 397.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1391.6 kB, 396.9 kB gzipped |
| Modules bundled | 76 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.183.0'
build     // { version: '0.183.0', hash: '8295f9e0365d', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
