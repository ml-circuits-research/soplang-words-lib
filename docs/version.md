# sopworld 0.86.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.86.0 |
| Build | e2aa1343b9ab |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 797.4 kB, 229.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 796.1 kB, 229.0 kB gzipped |
| Modules bundled | 46 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.86.0'
build     // { version: '0.86.0', hash: 'e2aa1343b9ab', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
