# sopworld 0.9.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.9.0 |
| Build | 3559700103d7 |
| Built | 2026-11-12 |
| `sopworld.mjs` (ES module) | 385.5 kB, 109.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 385.3 kB, 109.3 kB gzipped |
| Modules bundled | 19 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.9.0'
build     // { version: '0.9.0', hash: '3559700103d7', date: '2026-11-12' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
