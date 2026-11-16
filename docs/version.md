# sopworld 0.182.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.182.0 |
| Build | c446a4d8e434 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1392.6 kB, 397.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1389.7 kB, 396.5 kB gzipped |
| Modules bundled | 76 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.182.0'
build     // { version: '0.182.0', hash: 'c446a4d8e434', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
