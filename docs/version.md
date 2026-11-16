# sopworld 0.201.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.201.0 |
| Build | e9cc5e944b3f |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1506.3 kB, 425.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1503.2 kB, 424.9 kB gzipped |
| Modules bundled | 91 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.201.0'
build     // { version: '0.201.0', hash: 'e9cc5e944b3f', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
