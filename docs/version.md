# sopworld 0.82.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.82.0 |
| Build | 5aecb6e15a0e |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 787.0 kB, 226.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 785.8 kB, 225.9 kB gzipped |
| Modules bundled | 46 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.82.0'
build     // { version: '0.82.0', hash: '5aecb6e15a0e', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
