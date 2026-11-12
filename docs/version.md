# sopworld 0.11.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.11.1 |
| Build | ae28540e3fd1 |
| Built | 2026-11-12 |
| `sopworld.mjs` (ES module) | 404.8 kB, 114.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 404.6 kB, 114.8 kB gzipped |
| Modules bundled | 19 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.11.1'
build     // { version: '0.11.1', hash: 'ae28540e3fd1', date: '2026-11-12' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
