# sopworld 0.5.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.5.0 |
| Build | 7a73954388a7 |
| Built | 2026-11-10 |
| `sopworld.mjs` (ES module) | 248.0 kB, 70.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 247.9 kB, 70.9 kB gzipped |
| Modules bundled | 16 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.5.0'
build     // { version: '0.5.0', hash: '7a73954388a7', date: '2026-11-10' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
