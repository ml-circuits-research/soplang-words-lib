# sopworld 0.23.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.23.0 |
| Build | 4cd2d12a9694 |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 513.4 kB, 145.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 513.1 kB, 145.3 kB gzipped |
| Modules bundled | 24 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.23.0'
build     // { version: '0.23.0', hash: '4cd2d12a9694', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
