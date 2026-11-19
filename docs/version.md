# sopworld 0.225.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.225.1 |
| Build | 8a63e3e83fef |
| Built | 2026-11-19 |
| `sopworld.mjs` (ES module) | 1662.4 kB, 466.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1659.1 kB, 465.4 kB gzipped |
| Modules bundled | 109 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.225.1'
build     // { version: '0.225.1', hash: '8a63e3e83fef', date: '2026-11-19' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
