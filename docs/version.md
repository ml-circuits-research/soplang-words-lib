# sopworld 0.6.2

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.6.2 |
| Build | 2bcb9d13ba99 |
| Built | 2026-11-11 |
| `sopworld.mjs` (ES module) | 306.7 kB, 87.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 306.5 kB, 87.3 kB gzipped |
| Modules bundled | 17 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.6.2'
build     // { version: '0.6.2', hash: '2bcb9d13ba99', date: '2026-11-11' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
