# sopworld 0.7.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.7.0 |
| Build | da087347a76f |
| Built | 2026-11-11 |
| `sopworld.mjs` (ES module) | 313.1 kB, 89.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 312.9 kB, 89.0 kB gzipped |
| Modules bundled | 17 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.7.0'
build     // { version: '0.7.0', hash: 'da087347a76f', date: '2026-11-11' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
