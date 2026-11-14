# sopworld 0.53.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.53.0 |
| Build | 479dc7d0aaa3 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 615.9 kB, 174.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 615.3 kB, 174.6 kB gzipped |
| Modules bundled | 30 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.53.0'
build     // { version: '0.53.0', hash: '479dc7d0aaa3', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
