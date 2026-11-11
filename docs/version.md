# sopworld 0.6.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.6.1 |
| Build | 50275c47fc94 |
| Built | 2026-11-11 |
| `sopworld.mjs` (ES module) | 268.1 kB, 76.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 267.9 kB, 76.5 kB gzipped |
| Modules bundled | 16 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.6.1'
build     // { version: '0.6.1', hash: '50275c47fc94', date: '2026-11-11' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
