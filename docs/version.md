# sopworld 0.205.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.205.0 |
| Build | efc3fa4e49a1 |
| Built | 2026-11-17 |
| `sopworld.mjs` (ES module) | 1537.3 kB, 434.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1534.0 kB, 433.3 kB gzipped |
| Modules bundled | 95 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.205.0'
build     // { version: '0.205.0', hash: 'efc3fa4e49a1', date: '2026-11-17' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
