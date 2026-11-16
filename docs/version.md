# sopworld 0.189.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.189.0 |
| Build | 08747c1f8b81 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1419.3 kB, 404.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1416.4 kB, 403.6 kB gzipped |
| Modules bundled | 80 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.189.0'
build     // { version: '0.189.0', hash: '08747c1f8b81', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
