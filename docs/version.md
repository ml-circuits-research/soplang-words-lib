# sopworld 0.119.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.119.0 |
| Build | 39db91a09b37 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 926.6 kB, 269.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 924.6 kB, 268.8 kB gzipped |
| Modules bundled | 58 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.119.0'
build     // { version: '0.119.0', hash: '39db91a09b37', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
