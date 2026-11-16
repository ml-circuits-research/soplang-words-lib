# sopworld 0.199.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.199.0 |
| Build | 119eed91e1e1 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1494.1 kB, 422.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1490.9 kB, 422.0 kB gzipped |
| Modules bundled | 89 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.199.0'
build     // { version: '0.199.0', hash: '119eed91e1e1', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
