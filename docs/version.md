# sopworld 0.16.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.16.0 |
| Build | d41d73a9301a |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 426.7 kB, 121.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 426.5 kB, 121.3 kB gzipped |
| Modules bundled | 20 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.16.0'
build     // { version: '0.16.0', hash: 'd41d73a9301a', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
