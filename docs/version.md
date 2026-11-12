# sopworld 0.13.2

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.13.2 |
| Build | 087f67aba14e |
| Built | 2026-11-12 |
| `sopworld.mjs` (ES module) | 409.0 kB, 116.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 408.8 kB, 116.0 kB gzipped |
| Modules bundled | 19 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.13.2'
build     // { version: '0.13.2', hash: '087f67aba14e', date: '2026-11-12' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
