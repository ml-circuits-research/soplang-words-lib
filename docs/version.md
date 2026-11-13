# sopworld 0.20.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.20.0 |
| Build | 22ee706e8aec |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 493.3 kB, 139.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 493.1 kB, 139.7 kB gzipped |
| Modules bundled | 22 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.20.0'
build     // { version: '0.20.0', hash: '22ee706e8aec', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
