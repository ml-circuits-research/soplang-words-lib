# sopworld 0.124.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.124.0 |
| Build | 69a325bf4ed8 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 921.2 kB, 268.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 919.3 kB, 267.6 kB gzipped |
| Modules bundled | 58 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.124.0'
build     // { version: '0.124.0', hash: '69a325bf4ed8', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
