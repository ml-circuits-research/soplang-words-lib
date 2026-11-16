# sopworld 0.169.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.169.0 |
| Build | c00c73708d9a |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1333.1 kB, 384.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1330.3 kB, 384.1 kB gzipped |
| Modules bundled | 71 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.169.0'
build     // { version: '0.169.0', hash: 'c00c73708d9a', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
