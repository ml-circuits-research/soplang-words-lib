# sopworld 0.10.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.10.0 |
| Build | 4c8deb90d452 |
| Built | 2026-11-12 |
| `sopworld.mjs` (ES module) | 394.3 kB, 111.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 394.1 kB, 111.8 kB gzipped |
| Modules bundled | 19 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.10.0'
build     // { version: '0.10.0', hash: '4c8deb90d452', date: '2026-11-12' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
