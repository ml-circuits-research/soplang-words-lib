# sopworld 0.150.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.150.0 |
| Build | e30d6a7b8884 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 1129.0 kB, 328.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1126.6 kB, 327.8 kB gzipped |
| Modules bundled | 67 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.150.0'
build     // { version: '0.150.0', hash: 'e30d6a7b8884', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
