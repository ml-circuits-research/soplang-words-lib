# sopworld 0.107.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.107.0 |
| Build | cd202a3c9b7e |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 862.6 kB, 248.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 860.9 kB, 248.4 kB gzipped |
| Modules bundled | 51 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.107.0'
build     // { version: '0.107.0', hash: 'cd202a3c9b7e', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
