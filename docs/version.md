# sopworld 0.178.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.178.0 |
| Build | 5c92b5cb36d6 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1378.7 kB, 393.8 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1375.8 kB, 393.2 kB gzipped |
| Modules bundled | 74 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.178.0'
build     // { version: '0.178.0', hash: '5c92b5cb36d6', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
