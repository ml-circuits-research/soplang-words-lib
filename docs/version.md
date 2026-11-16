# sopworld 0.160.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.160.0 |
| Build | 291f9a379713 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1284.4 kB, 371.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1281.5 kB, 370.9 kB gzipped |
| Modules bundled | 70 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.160.0'
build     // { version: '0.160.0', hash: '291f9a379713', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
