# sopworld 0.141.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.141.0 |
| Build | f6b6f347981c |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 1006.2 kB, 293.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1004.0 kB, 293.0 kB gzipped |
| Modules bundled | 64 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.141.0'
build     // { version: '0.141.0', hash: 'f6b6f347981c', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
