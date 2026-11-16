# sopworld 0.180.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.180.0 |
| Build | 7c0aa0c6591c |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1381.8 kB, 394.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1378.9 kB, 393.9 kB gzipped |
| Modules bundled | 75 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.180.0'
build     // { version: '0.180.0', hash: '7c0aa0c6591c', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
