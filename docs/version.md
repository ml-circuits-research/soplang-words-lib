# sopworld 0.72.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.72.0 |
| Build | b1f22465774d |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 749.9 kB, 214.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 748.8 kB, 214.5 kB gzipped |
| Modules bundled | 41 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.72.0'
build     // { version: '0.72.0', hash: 'b1f22465774d', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
