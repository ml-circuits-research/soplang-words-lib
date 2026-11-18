# sopworld 0.221.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.221.0 |
| Build | 294633a1f3f8 |
| Built | 2026-11-18 |
| `sopworld.mjs` (ES module) | 1639.4 kB, 459.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1636.1 kB, 459.1 kB gzipped |
| Modules bundled | 107 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.221.0'
build     // { version: '0.221.0', hash: '294633a1f3f8', date: '2026-11-18' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
