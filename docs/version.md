# sopworld 0.118.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.118.0 |
| Build | 2b68b616070f |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 925.3 kB, 268.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 923.4 kB, 268.2 kB gzipped |
| Modules bundled | 54 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.118.0'
build     // { version: '0.118.0', hash: '2b68b616070f', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
