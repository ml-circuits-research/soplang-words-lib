# sopworld 0.217.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.217.0 |
| Build | 502667cfec57 |
| Built | 2026-11-18 |
| `sopworld.mjs` (ES module) | 1630.0 kB, 457.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1626.6 kB, 456.8 kB gzipped |
| Modules bundled | 107 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.217.0'
build     // { version: '0.217.0', hash: '502667cfec57', date: '2026-11-18' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
