# sopworld 0.198.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.198.0 |
| Build | 6a58079a1970 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1482.1 kB, 419.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1478.9 kB, 418.5 kB gzipped |
| Modules bundled | 88 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.198.0'
build     // { version: '0.198.0', hash: '6a58079a1970', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
