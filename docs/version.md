# sopworld 0.24.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.24.0 |
| Build | 38c466d762e0 |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 523.4 kB, 148.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 523.0 kB, 148.2 kB gzipped |
| Modules bundled | 25 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.24.0'
build     // { version: '0.24.0', hash: '38c466d762e0', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
