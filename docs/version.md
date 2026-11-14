# sopworld 0.35.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.35.0 |
| Build | 2d4a1d0ce95d |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 567.5 kB, 160.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 567.1 kB, 160.8 kB gzipped |
| Modules bundled | 27 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.35.0'
build     // { version: '0.35.0', hash: '2d4a1d0ce95d', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
