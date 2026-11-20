# sopworld 0.239.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.239.0 |
| Build | 8779d88fa5bd |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1766.0 kB, 494.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1762.5 kB, 493.9 kB gzipped |
| Modules bundled | 111 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.239.0'
build     // { version: '0.239.0', hash: '8779d88fa5bd', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
