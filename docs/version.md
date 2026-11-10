# sopworld 0.6.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.6.1 |
| Build | c034e3804d4e |
| Built | 2026-11-10 |
| `sopworld.mjs` (ES module) | 265.1 kB, 75.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 264.9 kB, 75.7 kB gzipped |
| Modules bundled | 16 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.6.1'
build     // { version: '0.6.1', hash: 'c034e3804d4e', date: '2026-11-10' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
