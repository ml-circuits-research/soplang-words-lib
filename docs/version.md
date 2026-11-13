# sopworld 0.31.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.31.0 |
| Build | 980003e2be4f |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 563.9 kB, 160.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 563.5 kB, 159.9 kB gzipped |
| Modules bundled | 27 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.31.0'
build     // { version: '0.31.0', hash: '980003e2be4f', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
