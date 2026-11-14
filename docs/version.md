# sopworld 0.37.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.37.0 |
| Build | 94d4b9541c4c |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 569.9 kB, 161.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 569.4 kB, 161.4 kB gzipped |
| Modules bundled | 27 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.37.0'
build     // { version: '0.37.0', hash: '94d4b9541c4c', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
