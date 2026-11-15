# sopworld 0.130.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.130.0 |
| Build | 150c9d0ec306 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 953.9 kB, 278.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 951.8 kB, 277.6 kB gzipped |
| Modules bundled | 63 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.130.0'
build     // { version: '0.130.0', hash: '150c9d0ec306', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
