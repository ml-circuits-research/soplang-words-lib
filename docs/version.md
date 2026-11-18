# sopworld 0.211.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.211.0 |
| Build | b97bce6a883e |
| Built | 2026-11-18 |
| `sopworld.mjs` (ES module) | 1605.7 kB, 450.8 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1602.3 kB, 450.1 kB gzipped |
| Modules bundled | 103 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.211.0'
build     // { version: '0.211.0', hash: 'b97bce6a883e', date: '2026-11-18' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
