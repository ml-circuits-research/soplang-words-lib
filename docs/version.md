# sopworld 0.245.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.245.0 |
| Build | 735774d6e31a |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1816.0 kB, 508.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1812.3 kB, 507.9 kB gzipped |
| Modules bundled | 115 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.245.0'
build     // { version: '0.245.0', hash: '735774d6e31a', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
