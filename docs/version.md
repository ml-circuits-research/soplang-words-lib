# sopworld 0.17.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.17.0 |
| Build | e093a5336542 |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 469.7 kB, 133.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 469.5 kB, 133.2 kB gzipped |
| Modules bundled | 21 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.17.0'
build     // { version: '0.17.0', hash: 'e093a5336542', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
