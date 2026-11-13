# sopworld 0.16.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.16.0 |
| Build | 5865d8ac4c42 |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 440.1 kB, 124.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 439.9 kB, 124.8 kB gzipped |
| Modules bundled | 20 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.16.0'
build     // { version: '0.16.0', hash: '5865d8ac4c42', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
