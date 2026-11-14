# sopworld 0.76.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.76.0 |
| Build | 181b59e76669 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 765.3 kB, 219.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 764.2 kB, 219.4 kB gzipped |
| Modules bundled | 44 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.76.0'
build     // { version: '0.76.0', hash: '181b59e76669', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
