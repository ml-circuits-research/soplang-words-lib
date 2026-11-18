# sopworld 0.209.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.209.0 |
| Build | 8dc67fc55e4d |
| Built | 2026-11-18 |
| `sopworld.mjs` (ES module) | 1543.8 kB, 435.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1540.4 kB, 434.8 kB gzipped |
| Modules bundled | 95 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.209.0'
build     // { version: '0.209.0', hash: '8dc67fc55e4d', date: '2026-11-18' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
