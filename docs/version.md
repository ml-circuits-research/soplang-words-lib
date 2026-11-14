# sopworld 0.50.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.50.0 |
| Build | 6212f05d2005 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 602.2 kB, 170.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 601.7 kB, 170.1 kB gzipped |
| Modules bundled | 29 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.50.0'
build     // { version: '0.50.0', hash: '6212f05d2005', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
