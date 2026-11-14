# sopworld 0.121.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.121.0 |
| Build | 51b8cbd957b8 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 929.8 kB, 270.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 927.9 kB, 269.8 kB gzipped |
| Modules bundled | 59 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.121.0'
build     // { version: '0.121.0', hash: '51b8cbd957b8', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
