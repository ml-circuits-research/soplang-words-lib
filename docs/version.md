# sopworld 0.111.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.111.0 |
| Build | 45a8cda9c718 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 875.7 kB, 253.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 873.9 kB, 252.7 kB gzipped |
| Modules bundled | 51 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.111.0'
build     // { version: '0.111.0', hash: '45a8cda9c718', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
