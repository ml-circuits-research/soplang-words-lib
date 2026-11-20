# sopworld 0.240.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.240.0 |
| Build | 89fb8ed1ea7b |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1766.5 kB, 494.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1763.0 kB, 494.0 kB gzipped |
| Modules bundled | 111 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.240.0'
build     // { version: '0.240.0', hash: '89fb8ed1ea7b', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
