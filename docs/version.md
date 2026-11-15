# sopworld 0.125.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.125.0 |
| Build | c283cc013574 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 921.9 kB, 268.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 920.0 kB, 267.9 kB gzipped |
| Modules bundled | 58 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.125.0'
build     // { version: '0.125.0', hash: 'c283cc013574', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
