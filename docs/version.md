# sopworld 0.132.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.132.0 |
| Build | 516fc85ffbc7 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 971.0 kB, 283.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 968.9 kB, 282.6 kB gzipped |
| Modules bundled | 63 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.132.0'
build     // { version: '0.132.0', hash: '516fc85ffbc7', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
