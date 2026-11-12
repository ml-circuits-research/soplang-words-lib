# sopworld 0.13.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.13.0 |
| Build | d8f32ac40d5f |
| Built | 2026-11-12 |
| `sopworld.mjs` (ES module) | 405.8 kB, 115.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 405.7 kB, 115.1 kB gzipped |
| Modules bundled | 19 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.13.0'
build     // { version: '0.13.0', hash: 'd8f32ac40d5f', date: '2026-11-12' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
