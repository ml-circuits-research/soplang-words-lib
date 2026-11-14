# sopworld 0.61.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.61.0 |
| Build | 7ace555ef444 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 679.6 kB, 193.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 678.8 kB, 193.6 kB gzipped |
| Modules bundled | 35 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.61.0'
build     // { version: '0.61.0', hash: '7ace555ef444', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
