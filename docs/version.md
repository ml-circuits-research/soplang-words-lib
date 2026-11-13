# sopworld 0.21.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.21.0 |
| Build | 581fd99b95e5 |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 503.1 kB, 142.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 502.9 kB, 142.2 kB gzipped |
| Modules bundled | 22 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.21.0'
build     // { version: '0.21.0', hash: '581fd99b95e5', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
