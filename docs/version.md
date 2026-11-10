# sopworld 0.5.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.5.0 |
| Build | ac112ff5c422 |
| Built | 2026-11-10 |
| `sopworld.mjs` (ES module) | 251.7 kB, 71.8 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 251.6 kB, 71.8 kB gzipped |
| Modules bundled | 16 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.5.0'
build     // { version: '0.5.0', hash: 'ac112ff5c422', date: '2026-11-10' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
