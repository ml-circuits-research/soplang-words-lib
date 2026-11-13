# sopworld 0.28.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.28.0 |
| Build | 24e3bc57f8bc |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 541.4 kB, 153.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 541.0 kB, 152.9 kB gzipped |
| Modules bundled | 25 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.28.0'
build     // { version: '0.28.0', hash: '24e3bc57f8bc', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
