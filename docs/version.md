# sopworld 0.18.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.18.0 |
| Build | 27f56a94cbec |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 478.9 kB, 136.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 478.6 kB, 136.0 kB gzipped |
| Modules bundled | 22 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.18.0'
build     // { version: '0.18.0', hash: '27f56a94cbec', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
