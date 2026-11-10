# Builds the static documentation pages of sopworld into docs/ (python3 tools/build_docs.py).
# Only needed when the text of the pages changes; the library build is tools/build.mjs.
import html, pathlib, textwrap
OUT = pathlib.Path(__file__).resolve().parent.parent / 'docs'
PAGES = [('index.html', 'Overview'), ('concepts.html', 'Concepts'), ('reasoning.html', 'Reasoning'),
         ('usecases.html', 'Use cases'), ('solvers.html', 'Solvers'), ('api.html', 'API'),
         ('playground.html', 'Playground'), ('roadmap.html', 'Analysis and roadmap')]
VERSION = '0.4'

def code(text, label=None):
    body = html.escape(textwrap.dedent(text).strip('\n'))
    cap = f'<figcaption>{html.escape(label)}</figcaption>' if label else ''
    return f'<figure class="code">{cap}<pre><code>{body}</code></pre></figure>'

def table(head, rows):
    h = ''.join(f'<th>{c}</th>' for c in head)
    b = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'<div class="table"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'

def page(fname, title, lead, body, tail='', wide=False):
    nav = ''.join(f'<a href="{f}"{" aria-current=\"page\"" if f == fname else ""}>{t}</a>' for f, t in PAGES)
    doc_title = 'sopworld' if fname == 'index.html' else f'sopworld {title}'
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{doc_title}</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="top">
  <a class="brand" href="index.html"><span class="mark" aria-hidden="true"></span>sopworld <small>{VERSION}</small></a>
  <nav aria-label="Documentation">{nav}</nav>
</header>
<main{' class="wide"' if wide else ''}>
<h1>{title}</h1>
<p class="lead">{lead}</p>
{body}
</main>
<footer>sopworld {VERSION} · consistency matrices for SOP Lang circuits · one file, no dependencies, Node and browsers · <a href="selftest.html">self-test</a></footer>
{tail}
</body>
</html>
'''

CSS = r'''/* sopworld documentation
   layout: one reading column (68ch) under a wrapping top bar; code and tables scroll on their own */
:root {
  --bg: #f2f4f6;
  --surface: #ffffff;
  --ink: #15202a;
  --muted: #55636f;
  --line: #d3dae1;
  --accent: #a94e14;
  --accent-soft: #f5e6da;
  --code-bg: #e8edf1;
  --ok: #1d6b45;
  --no: #a32626;
  --font-display: "Bricolage Grotesque", "Avenir Next", "Segoe UI", sans-serif;
  --font-body: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f161d; --surface: #17212a; --ink: #e4eaef; --muted: #96a4b0; --line: #2b3945;
    --accent: #eb9558; --accent-soft: #3a2717; --code-bg: #0a1016; --ok: #6fcf9b; --no: #f08a8a;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0f161d; --surface: #17212a; --ink: #e4eaef; --muted: #96a4b0; --line: #2b3945;
  --accent: #eb9558; --accent-soft: #3a2717; --code-bg: #0a1016; --ok: #6fcf9b; --no: #f08a8a;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 400 1rem/1.6 var(--font-body); }
a { color: var(--accent); text-underline-offset: 0.15em; }
a:focus-visible, summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }

.top { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.5rem; padding: 0.75rem max(16px, calc((100% - 68ch) / 2));
  background: var(--surface); border-bottom: 1px solid var(--line); }
.brand { display: flex; align-items: center; gap: 0.5rem; font: 700 1.1rem var(--font-display); color: var(--ink); text-decoration: none; }
.brand small { font: 500 0.75rem var(--font-mono); color: var(--muted); }
.mark { width: 1.1rem; height: 1.1rem; border-radius: 50%; border: 3px solid var(--accent); box-shadow: inset 0 0 0 3px var(--surface), inset 0 0 0 6px var(--accent); }
nav { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; font-size: 0.92rem; }
nav a { color: var(--muted); text-decoration: none; padding: 0.15rem 0; border-bottom: 2px solid transparent; }
nav a:hover { color: var(--ink); }
nav a[aria-current="page"] { color: var(--ink); border-bottom-color: var(--accent); font-weight: 600; }

main { max-width: calc(68ch + 32px); margin: 0 auto; padding: 2rem 16px 3rem; }
h1, h2, h3 { font-family: var(--font-display); text-wrap: balance; line-height: 1.2; }
h1 { font-size: 2rem; margin: 0 0 0.5rem; }
h2 { font-size: 1.35rem; margin: 2.5rem 0 0.5rem; padding-top: 1rem; border-top: 1px solid var(--line); }
h3 { font-size: 1.05rem; margin: 1.5rem 0 0.25rem; }
p { margin: 0.6rem 0; }
.lead { font-size: 1.1rem; color: var(--muted); margin-bottom: 1.5rem; }
ul, ol { padding-left: 1.25rem; margin: 0.6rem 0; }
li { margin: 0.25rem 0; }
code { font: 0.88em var(--font-mono); background: var(--code-bg); padding: 0.08em 0.3em; border-radius: 3px; }
.code { margin: 1rem 0; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; background: var(--code-bg); }
.code figcaption { font: 500 0.75rem var(--font-mono); color: var(--muted); padding: 0.4rem 0.8rem; border-bottom: 1px solid var(--line); background: var(--surface); }
.code pre { margin: 0; padding: 0.8rem; overflow-x: auto; }
.code code { background: none; padding: 0; font-size: 0.82rem; line-height: 1.5; }
.table { overflow-x: auto; margin: 1rem 0; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); }
table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
th, td { text-align: left; vertical-align: top; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--line); }
th { font-weight: 600; color: var(--muted); font-size: 0.8rem; }
tbody tr:last-child td { border-bottom: 0; }
td:first-child { white-space: nowrap; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 0.75rem; margin: 1rem 0; }
.card { display: block; padding: 0.9rem 1rem; background: var(--surface); border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: 6px; color: var(--ink); text-decoration: none; }
.card strong { display: block; font-family: var(--font-display); }
.card span { color: var(--muted); font-size: 0.9rem; }
.note { margin: 1rem 0; padding: 0.75rem 1rem; background: var(--accent-soft); border-radius: 6px; }
.ok { color: var(--ok); font-weight: 600; }
.no { color: var(--no); font-weight: 600; }
.diagram { margin: 1.25rem 0; overflow-x: auto; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 0.75rem; }
.diagram svg { display: block; min-width: 560px; width: 100%; height: auto; }
.diagram .box { fill: var(--bg); stroke: var(--line); stroke-width: 1.5; }
.diagram .hot { stroke: var(--accent); }
.diagram text { fill: var(--ink); font: 500 13px var(--font-body); }
.diagram .small { fill: var(--muted); font-size: 11px; }
.diagram .wire { stroke: var(--accent); stroke-width: 2; fill: none; }
.diagram .dot { fill: var(--accent); }
main.wide { max-width: 1180px; }
.pg { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); gap: 1rem; align-items: start; }
.pg section { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
.pg h2 { margin: 0; padding: 0; border: 0; font-size: 1rem; }
.pg label { font-size: 0.8rem; font-weight: 600; color: var(--muted); }
.pg textarea, .pg select, .pg input { width: 100%; font: 0.8rem/1.45 var(--font-mono); color: var(--ink); background: var(--code-bg); border: 1px solid var(--line); border-radius: 4px; padding: 0.5rem; }
.pg select { font-family: var(--font-body); font-size: 0.9rem; }
.pg textarea { resize: vertical; white-space: pre; overflow: auto; }
.pg textarea:focus-visible, .pg select:focus-visible, .pg input:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
button { font: 600 0.85rem var(--font-body); color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 4px; padding: 0.4rem 0.7rem; cursor: pointer; }
button:hover { border-color: var(--accent); }
button.primary { background: var(--accent); border-color: var(--accent); color: var(--surface); }
.pg pre { margin: 0; font: 0.78rem/1.5 var(--font-mono); white-space: pre-wrap; overflow-wrap: anywhere; }
#state { background: var(--code-bg); border-radius: 4px; padding: 0.6rem; max-height: 22rem; overflow: auto; }
#open { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.88rem; }
#open li { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
#open button { font: 500 0.78rem var(--font-mono); padding: 0.2rem 0.5rem; }
#log { display: flex; flex-direction: column; gap: 0.5rem; max-height: 30rem; overflow: auto; }
.entry { border-left: 4px solid var(--ok); padding-left: 0.6rem; }
.entry.bad { border-left-color: var(--no); }
.entry strong { font-size: 0.82rem; }
#status { color: var(--muted); font-size: 0.82rem; }
.results { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.results li { padding: 0.45rem 0.75rem; background: var(--surface); border: 1px solid var(--line); border-left: 4px solid var(--ok); border-radius: 4px; font-size: 0.92rem; }
.results li.bad { border-left-color: var(--no); }
.results small { color: var(--muted); }
footer { max-width: calc(68ch + 32px); margin: 0 auto; padding: 1rem 16px 2rem; color: var(--muted); font-size: 0.85rem; border-top: 1px solid var(--line); }
@media (max-width: 420px) { h1 { font-size: 1.6rem; } td:first-child { white-space: normal; } }
'''

DIAGRAM = '''<div class="diagram" role="img" aria-label="Wires from outside enter a transaction: ingest, chase, validate. The world then commits or refuses. Completion turns open keys into forced values, assumptions or questions.">
<svg viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg">
  <rect class="box" x="10" y="20" width="120" height="60" rx="6"/><text x="70" y="46" text-anchor="middle">wires from</text><text x="70" y="64" text-anchor="middle">outside</text>
  <rect class="box hot" x="170" y="10" width="360" height="80" rx="6"/><text class="small" x="182" y="28">one transaction</text>
  <rect class="box" x="184" y="38" width="100" height="40" rx="4"/><text x="234" y="63" text-anchor="middle">ingest</text>
  <rect class="box" x="300" y="38" width="100" height="40" rx="4"/><text x="350" y="63" text-anchor="middle">chase rules</text>
  <rect class="box" x="416" y="38" width="100" height="40" rx="4"/><text x="466" y="63" text-anchor="middle">validate</text>
  <rect class="box" x="570" y="10" width="120" height="34" rx="6"/><text x="630" y="32" text-anchor="middle">commit</text>
  <rect class="box" x="570" y="56" width="120" height="34" rx="6"/><text x="630" y="78" text-anchor="middle">refuse + why</text>
  <path class="wire" d="M130 50 H170"/><path class="wire" d="M284 58 H300"/><path class="wire" d="M400 58 H416"/>
  <path class="wire" d="M530 40 H550 V27 H570"/><path class="wire" d="M530 60 H550 V73 H570"/>
  <rect class="box" x="170" y="130" width="360" height="100" rx="6"/><text class="small" x="182" y="148">the world</text>
  <text x="190" y="172">facts</text><text class="small" x="190" y="188">told, derived, filled</text>
  <text x="330" y="172">matrix</text><text class="small" x="330" y="188">slots, rules, denies</text>
  <text x="440" y="172">log</text><text class="small" x="440" y="188">replayable</text>
  <text class="small" x="190" y="216">every wire and value knows where it came from</text>
  <path class="wire" d="M630 44 V110 H350 V130"/><circle class="dot" cx="350" cy="130" r="4"/>
  <rect class="box" x="10" y="150" width="120" height="60" rx="6"/><text x="70" y="176" text-anchor="middle">forced values,</text><text x="70" y="194" text-anchor="middle">questions</text>
  <path class="wire" d="M170 180 H130"/><circle class="dot" cx="130" cy="180" r="4"/>
  <path class="wire" d="M70 150 V80"/><circle class="dot" cx="70" cy="80" r="4"/>
</svg></div>'''

P = {}

# ----------------------------------------------------------------------------- index
P['index.html'] = ('sopworld', 'A small engine that keeps a set of SOP Lang wires consistent with rules written as wires. It derives what follows, completes what is missing, asks for what it cannot decide, and refuses what is not allowed.', f'''
<h2>What it is</h2>
<p>A <strong>world</strong> holds facts. A <strong>consistency matrix</strong> says which worlds are possible: which keys a wire has, what must exist when something else exists, what may never happen. The matrix is written in the same language as the facts, as pattern circuits with variables.</p>
<p>Every change goes through one transaction. Either the world accepts it together with all its consequences, or nothing changes and you get the reason.</p>
{DIAGRAM}
<h2>One minute example</h2>
{code("""
import { World } from 'sopworld';

const w = new World();
w.load(`
  @k core.slot of=acceleration key=of id=true      # one acceleration per body

  ?b body mass=?m                                  # if there is a body
  ?f force on=$b magnitude=?F                      # and a force on it
  @a acceleration of=$b magnitude=?A               # there is an acceleration
  @c core.calc out=?A fn=div args=?F args=?m       # with A = F / m
  @newton2 core.rule when=$b when=$f with=$c then=$a

  ?b0 body mass=?m0
  @t core.check fn=lte args=?m0 args=0
  @positive core.deny when=$b0 if=$t why="mass must be positive"
`);

w.tell('@b1 body mass=2  @f1 force on=$b1 magnitude=10  @a1 acceleration of=$b1');
w.get('a1').attrs.magnitude        // ['5']   the open key was filled
w.explain('a1').fills[0]           // { key: 'magnitude', value: '5', via: 'newton2', from: ['b1', 'f1'] }

w.tell('@b2 body mass=0').violations[0].why          // 'mass must be positive'
w.tell('@a9 acceleration of=$b1 magnitude=7').ok     // false: conflicts with the derived 5
""", "example.mjs")}
<h2>What you can do with it</h2>
{table(['Operation', 'Question', 'Calls'], [
 ['Deduction', 'What follows from what is known?', '<code>tell</code>, <code>fill</code>'],
 ['Completion', 'What is missing, and which values are still possible?', '<code>open</code>, <code>suggest</code>, <code>next</code>, <code>complete</code>'],
 ['Search', 'Is there a way to fill everything that is open?', '<code>solve</code>, <code>solveReport</code>, <code>solveAsync</code>, <code>apply</code>'],
 ['Abduction', 'What would have to be true for this to hold?', '<code>abduce</code>, <code>adopt</code>'],
 ['Induction', 'Which rule or slot explains these examples?', '<code>induce</code>, <code>induceSlots</code>'],
 ['Revision', 'What changes when a fact goes away or is replaced?', '<code>retract</code>, <code>replace</code>'],
 ['Explanation', 'Where does this come from?', '<code>explain</code>, <code>history</code>, <code>on</code>'],
])}
<h2>Where to go next</h2>
<div class="cards">
 <a class="card" href="concepts.html"><strong>Concepts</strong><span>Wires, the seven matrix wire types, what a transaction does.</span></a>
 <a class="card" href="reasoning.html"><strong>Reasoning</strong><span>Deduction, completion, abduction, induction, revision, each on a small world.</span></a>
 <a class="card" href="usecases.html"><strong>Use cases</strong><span>Chat completion, digital twin, procedures, diagnosis, composing knowledge.</span></a>
 <a class="card" href="solvers.html"><strong>Solvers</strong><span>The search strategy is pluggable: two built in, clingo and SAT from outside.</span></a>
 <a class="card" href="playground.html"><strong>Playground</strong><span>Edit a matrix, tell facts, answer the questions the world asks.</span></a>
 <a class="card" href="api.html"><strong>API</strong><span>Every method, option, result field and violation kind.</span></a>
 <a class="card" href="roadmap.html"><strong>Analysis and roadmap</strong><span>What is solid, what is limited, what to build next.</span></a>
</div>
<h2>One file, two places to run</h2>
<p>The library is built into a single file with no dependencies. The same file runs in Node and in a browser, so a world can live on a server, in a page, or in both with the same matrix.</p>
{code("""
<!-- browser, ES module: this folder is what GitHub Pages serves -->
<script type="module">
  import { World } from './sopworld.mjs';
  const w = new World();
</script>

<!-- browser, classic script: the global is `sopworld` -->
<script src="sopworld.js"></script>

// Node
import { World } from './docs/sopworld.mjs';          // ES module
const { World } = require('./docs/sopworld.js');       // CommonJS
""")}
{table(['File', 'Use'], [
 ['<code>sopworld.mjs</code>', 'ES module for browsers and Node'],
 ['<code>sopworld.js</code>', 'Classic script (global <code>sopworld</code>) and CommonJS'],
 ['<code>sopworld.d.ts</code>', 'Type declarations'],
])}
<p>Try it now in the <a href="playground.html">playground</a>, or run the <a href="selftest.html">self-test</a> to see the build pass its checks in this browser.</p>
{code("""
npm run build            # src/*.mjs  ->  docs/sopworld.mjs and docs/sopworld.js
npm test                 # the test suite on the sources, then again on the built file
npm run test:browser     # the self-test and the playground in headless Chrome
npm run examples         # eight runnable demonstrations
npx sopworld check matrix.sop facts.sop
""")}
''')

# ----------------------------------------------------------------------------- concepts
P['concepts.html'] = ('Concepts', 'The data model in the order you meet it: a wire, a circuit, the matrix, and what happens when the world is told something.', f'''
<h2>Wire and circuit</h2>
{code("""
@id type key=value key=value ...      a wire
?id type key=?x key=$other ...        a pattern wire, matched against facts
""")}
<ul>
 <li>Values are atoms (<code>water</code>, <code>10</code>, <code>10:00</code>), strings (<code>"free text"</code>), references (<code>$id</code>) or variables (<code>?x</code>, only in the matrix and in queries).</li>
 <li>A key may repeat. A wire may span lines. <code>#</code> starts a comment.</li>
 <li>A missing key means unknown, not false. A required key without a value is an open question.</li>
 <li>Wires linked by <code>$id</code> references form a circuit. Wires with no path between them are independent, so parallelism is the default and sequence comes from references.</li>
 <li>Facts and matrix wires have separate id spaces: a pattern <code>?m1</code> does not clash with a fact <code>@m1</code>.</li>
</ul>
<h2>The matrix: seven wire types</h2>
{table(['Type', 'Says', 'Main keys'], [
 ['<code>core.slot</code>', 'One key of one type: is it required, what may it hold', '<code>of key required many id type enum default ask</code>'],
 ['<code>core.type</code>', 'A type accepts only its declared keys', '<code>of closed</code>'],
 ['<code>core.rule</code>', 'If the <code>when</code> circuit exists, the <code>then</code> circuit must exist', '<code>when with if not then</code>'],
 ['<code>core.deny</code>', 'This circuit may never exist', '<code>when with if not why</code>'],
 ['<code>core.calc</code>', 'A value computed by a named function', '<code>out fn args</code>'],
 ['<code>core.check</code>', 'A condition checked by a named function', '<code>fn args</code>'],
 ['<code>core.abducible</code>', 'A type, or a key of a type, that may be assumed', '<code>of key cost</code>'],
])}
<p>An eighth type, <code>core.use</code>, loads another matrix from a library (see <a href="usecases.html#compose">composition</a>).</p>
<h3>Slots</h3>
{code("""
@k1 core.slot of=meeting key=room required=true type=room ask="Which room?"
@k2 core.slot of=meeting key=time required=true enum=10:00 enum=14:00
@k3 core.slot of=meeting key=duration required=true default=30
@k4 core.slot of=acceleration key=of id=true
@t  core.type of=meeting closed=true
""")}
<ul>
 <li><code>required</code>: the key is an open question until it has a value.</li>
 <li><code>type</code>, <code>enum</code>, or <code>min</code> with <code>max</code> and <code>step</code> give the key a closed domain, which makes it searchable. <code>min</code> and <code>max</code> alone are checked on every value.</li>
 <li><code>default</code> is an assumption: weaker than anything told, dropped when it gets in the way.</li>
 <li><code>id</code> makes the key part of the wire's identity. Two wires of the type with the same identity values are one entity.</li>
 <li><code>ask</code> is the question of the key in natural language.</li>
</ul>
<h3>Rules and denies</h3>
{code("""
?ma meeting room=?r time=?t
?mb meeting room=?r time=?t
@t_other core.check fn=neq args=?ma args=?mb
@no_double_booking core.deny when=$ma when=$mb if=$t_other why="room already booked"
""")}
<ul>
 <li>Variables are local to one rule. Inside a rule, <code>$b</code> means the wire matched by pattern <code>?b</code> or produced by template <code>@b</code>.</li>
 <li>Code lives only in named functions. Built in: <code>add sub mul div min max concat</code> and <code>eq neq lt lte gt gte before</code>. Pass your own with <code>new World({{ fns }})</code>.</li>
 <li>Numbers may carry a unit: <code>2kg + 3kg = 5kg</code>, <code>10N / 2kg = 5N/kg</code>, <code>6m / 2m = 3</code>. Adding different units is not applicable, so the rule does not fire.</li>
 <li><code>not=</code> is negation as failure. It is maintained: when a wire arrives that ends the absence, the conclusion is withdrawn. A matrix where a rule negates something its own consequences can produce is refused.</li>
 <li>A template value whose variable is unbound is left out, so the new wire has an open key.</li>
</ul>
<h2>What a change does</h2>
<ol>
 <li><strong>Ingest.</strong> Each wire is classified as matrix or fact. A fact with the identity of an existing wire is merged into it.</li>
 <li><strong>Chase.</strong> Rules run to a fixpoint, driven by the wires that changed. A template that is already satisfied changes nothing; otherwise an existing wire is completed or a new one is created.</li>
 <li><strong>Validate.</strong> Slots of every touched wire, dangling references, then every deny.</li>
 <li><strong>Commit or roll back.</strong> With any violation the world is exactly as before.</li>
</ol>
{code("""
{ ok, added, derived, filled, merged, removed, violations, revised? }

violation: { kind, why, rule, wires, support }     support = the told wires the refusal rests on
""", "result of tell, fill, replace, step")}
<h3>Same wire or new wire</h3>
<p>When a rule produces a wire of a type that has identity keys, the wire with the same identity is completed, and a different value on a single-valued key is a conflict. Without identity keys, an existing wire that already contains everything the template says satisfies it; otherwise a new wire is created. Its id is a hash of the rule and its bindings, so it is the same every time it is derived.</p>
<h3>Provenance</h3>
<p>Every derived wire and every filled value records the rule (<code>via</code>) and the wires it came from (<code>from</code>). The engine also records each rule firing with what it read and what it wrote. That record is what makes retraction and revision incremental.</p>
<h3>Termination</h3>
<p>A derived wire has a depth: one more than the deepest wire it came from. A change that would exceed <code>maxDepth</code> (12 by default) is refused, which stops rules that feed themselves.</p>
''')

# ----------------------------------------------------------------------------- reasoning
P['reasoning.html'] = ('Reasoning', 'Five ways to use the same matrix. Each section shows the wires that matter and what the library returned when the example ran.', f'''
<h2 id="deduction">Deduction</h2>
<p>Telling a fact runs the rules. Recursive rules reach a fixpoint; a deny stops impossible conclusions.</p>
{code("""
?p1 parent of=?x child=?y
@anc1 ancestor of=?x desc=?y
@base core.rule when=$p1 then=$anc1

?p2 parent of=?x child=?y
?a2 ancestor of=?y desc=?z
@anc2 ancestor of=?x desc=?z
@step core.rule when=$p2 when=$a2 then=$anc2

?a3 ancestor of=?x desc=?x
@no_loops core.deny when=$a3 why="nobody is their own ancestor"
""", "family matrix")}
{code("""
f.tell('@e1 parent of=ana child=bogdan  @e2 parent of=bogdan child=carla  @e3 parent of=carla child=dan');
f.ask('?a ancestor of=?who desc=dan').map(x => x.who)      // ['carla', 'bogdan', 'ana']
f.tell('@e4 parent of=carla child=ana').violations[0].why  // 'nobody is their own ancestor'
""")}
<h2 id="completion">Completion</h2>
<p>The logical counterpart of predicting the next token: given the current circuit, produce the values that must follow and questions for the rest.</p>
{table(['Call', 'Returns'], [
 ['<code>open(id?)</code>', 'Required keys without a value'],
 ['<code>suggest(id, key)</code>', 'Values the world accepts, that also leave the other open keys completable'],
 ['<code>next()</code>', 'Forced fills, default fills, <code>core.question</code> wires, dead keys. Changes nothing'],
 ['<code>complete({ defaults })</code>', 'Commits forced fills one by one, since each can force the next'],
 ['<code>complete({ choose: true })</code>', 'Also commits one full solution for what is still open, as assumptions'],
 ['<code>solve()</code>', 'One joint assignment of all open keys with a closed domain, or <code>null</code>. See <a href="solvers.html">Solvers</a>'],
])}
{code("""
w.tell('@m0 meeting room=$big time=10:00 people=8 duration=60');
w.tell('@m1 meeting people=9');
w.complete({ defaults: true }).filled
// room=$big   forced   the small room holds 4
// time=14:00  forced   the big room is taken at 10:00
// duration=30 default  an assumption
""", "meeting world: rooms small (4) and big (12), times 10:00 and 14:00")}
<p>A value is offered only if a full completion still exists with it. A third meeting for 3 people gets the small room directly, because the big room is taken at both times. With <code>strict: true</code>, a statement that leaves no completion at all is refused with <code>dead-end</code>.</p>
<p>Defaults are assumptions. Telling a different value replaces the default and everything that followed from it; the result lists what was dropped in <code>revised</code>.</p>
<h2 id="abduction">Abduction</h2>
<p>Given something observed, find what would have to be assumed. Candidates are found backwards through the rules, then each one is verified forwards in a scratch transaction, so denies prune explanations.</p>
{code("""
@ab_rain core.abducible of=rain
@ab_spr  core.abducible of=sprinkler
... rain -> wet, sprinkler -> wet, wet -> slippery ...
@no_winter_sprinkler core.deny when=$s0 when=$win why="sprinklers are off in winter"
""", "garden matrix")}
{code("""
w.abduce('?g slippery place=lawn').map(e => e.text)
// ['@hyp3 rain place=lawn', '@hyp5 sprinkler place=lawn']
w.tell('@now season name=winter');
w.abduce('?g slippery place=lawn').map(e => e.text)
// ['@hyp3 rain place=lawn']
""")}
<p>The assumption can also be the value of an open key of an existing wire, declared with <code>core.abducible of=patient key=condition</code>:</p>
{code("""
c.abduce('?s symptom of=$ion kind=cough').map(e => e.text)
// ['ion.condition=flu', 'ion.condition=allergy']
c.abduce('?a symptom of=$ion kind=cough  ?b symptom of=$ion kind=fever').map(e => e.text)
// ['ion.condition=flu']
adopt(c, explanation)      // commit it; the other symptoms of flu are then derived
""")}
<p>Abduction goes through calculations. With a rule "change = paid &minus; total", a payment whose total is 15 and <code>paid</code> declared abducible, the value is computed, not guessed:</p>
{code("""
w.abduce('?x change amount=5').map(e => e.text)
// ['p1.paid=20']
""")}
<p><code>add</code>, <code>sub</code>, <code>mul</code> and <code>div</code> are solved for one missing argument, along a chain of rules if need be. For any other function the values of the slot's <code>enum</code> or range are tried.</p>
<p>Explanations come back minimal and cheapest first. <code>cost=</code> on the abducible sets how reluctant the world is to assume it.</p>
<h2 id="induction">Induction</h2>
<p>From example circuits to a rule. What is equal in all examples stays constant; what differs becomes a variable; the same pair of differing values becomes the same variable, which recovers co-reference. Wire order in the examples does not matter.</p>
{code("""
induce([
  { when: '@a parent of=tom child=bob  @b parent of=bob child=ann', then: '@c grandparent of=tom child=ann' },
  { when: '@a parent of=eve child=joe  @b parent of=sue child=eve', then: '@c grandparent of=sue child=joe' },
], { name: 'grandparent' }).text

?grandparent_p0 parent of=?v0 child=?v1
?grandparent_p1 parent of=?v1 child=?v2
@grandparent_t0 grandparent of=?v0 child=?v2
@grandparent core.rule when=$grandparent_p0 when=$grandparent_p1 then=$grandparent_t0
""")}
<p>A value of the conclusion that is computed from the premises (sum, difference, product, ratio) is recognised:</p>
{code("""
induce([
  { when: '@l line qty=2 price=10', then: '@t total of=$l amount=20' },
  { when: '@l line qty=3 price=5',  then: '@t total of=$l amount=15' },
  { when: '@l line qty=7 price=3',  then: '@t total of=$l amount=21' },
], { name: 'line_total' }).text

?line_total_p0 line qty=?v3 price=?v4
@line_total_t0 total of=$line_total_p0 amount=?v5
@line_total_c0 core.calc out=?v5 fn=mul args=?v3 args=?v4
@line_total core.rule when=$line_total_p0 then=$line_total_t0 with=$line_total_c0
""")}
<ul>
 <li>Patterns of the same type must match different wires, so "two bookings" never means one booking twice.</li>
 <li><code>negatives</code>: circuits the rule must not match. The comparison between variables that excludes them is added (<code>qty &lt;= stock</code>); a negative that nothing separates is reported in <code>coversNegative</code>.</li>
 <li><code>kind: 'deny'</code> learns a constraint from examples of forbidden states.</li>
 <li><code>tolerant: true</code> skips examples of a different shape and reports them.</li>
 <li><code>induceSlots(wires)</code> proposes slots: required keys, reference types, small enums.</li>
 <li>Telling a learned rule to a world validates it there. A rule whose consequences hit a deny is refused.</li>
</ul>
<h2 id="revision">Revision and explanation</h2>
{code("""
w.retract('r1')            // the wire, told wires that refer to it, and what rested on them
w.replace('r1', '@r1 reading of=$t1 level=40')    // one transaction; wires that refer to r1 stay
w.trial(x => { x.tell(...); return x.ask(...) })  // what-if: everything is undone afterwards
w.explain('a1')            // justification tree: told, or via which rule from which wires
w.history()                // tell, derive, fill, merge, remove, unfill, retract, revise
""")}
<p>Retraction is incremental. Rule firings that read a removed wire are undone, their inputs go back on the agenda, and the chase derives again what still has support. A wet lawn explained by rain and by a sprinkler stays wet when the rain is retracted. The test suite checks that the incremental result equals a rebuild from scratch on five worlds.</p>
''')

# ----------------------------------------------------------------------------- use cases
P['usecases.html'] = ('Use cases', 'Seven ways to put a world to work. Each one names the pattern, shows the calls, and says what you still need around the library.', f'''
<h2 id="chat">1. Logical completion in a chat</h2>
<p><strong>Pattern.</strong> A formaliser turns each user turn into incomplete wires. The world decides what follows, what was only assumed, what must be asked and what is impossible. One call per turn.</p>
{code("""
const s = w.step('@m1 meeting people=3');     // tell + complete
s.filled      // what the world decided by itself
s.questions   // core.question wires: about=, seek=, option=, text=
s.revised     // assumptions dropped because of this turn

w.answer(s.questions[0], '$small');           // the user picked an option
""")}
{code("""
User: "Book a meeting for 9 people."
  world completes: room=$big (forced), time=14:00 (forced), duration=30 (default)
User: "Actually, make it an hour."
  accepted, assumption dropped: m1.duration=30
User: "And another one for 3 people."
  world completes: room=$small (forced)
  world asks: @q_m2_time core.question about=$m2 seek=time option=10:00 option=14:00 text="What time?"
User: "A third one, for 10 people at 14:00."     (strict mode)
  refused: no consistent completion of the open keys exists
""", "node examples/chat.mjs")}
<p><strong>You bring.</strong> The step from text to wires (an LLM, or a reader such as VSS) and the step from question wires back to text. The world guarantees that whatever is generated is consistent.</p>
<h2 id="twin">2. Digital twin of a device or process</h2>
<p><strong>Pattern.</strong> One wire per current reading, identified by what it measures. A new reading replaces the old one in one transaction. Alarms and derived states are rules; impossible states are denies. A listener forwards committed changes.</p>
{code("""
@k_reading core.slot of=reading key=of id=true type=tank
... reading + tank, level / capacity >= 0.9  ->  alarm of=$t kind=high_level
... level > capacity                         ->  deny "level above capacity: sensor fault"
... pump on + valve closed on the same tank  ->  deny "pump running against a closed valve"
""", "plant matrix")}
{code("""
w.on(events => forward(events));
w.tell('@r1 reading of=$t1 level=95');                    // alarm derived
w.replace('r1', '@r1 reading of=$t1 level=40');           // alarm removed with its cause
w.replace('r1', '@r1 reading of=$t1 level=120').ok        // false; the twin still says 40
World.fromJSON(JSON.parse(saved))                         // restore after a restart
""", "node examples/twin.mjs")}
<p><strong>You bring.</strong> Transport and timing. The world has no clock: time is a value you put on wires.</p>
<h2 id="procedure">3. Procedures and workflows</h2>
<p><strong>Pattern.</strong> Steps are facts linked by <code>after=</code>. What is ready next is a rule with negation ("the previous step is done and this one is not"). Doing a step early is a deny. Undoing a step is a retraction.</p>
{code("""
ready: ['$mix']
skip to cool -> ['the previous step is not done']
mix done, ready: ['$bake']
bake done, ready: ['$cool']
bake undone, ready: ['$bake']
""", "node examples/workflow.mjs")}
<p>The same matrix serves any procedure: the steps are data. This is the shape of an SOP executed by an agent, with the world as the record of what was done and what may be done next.</p>
<h2 id="diagnosis">4. Diagnosis and explanation</h2>
<p><strong>Pattern.</strong> Rules run from causes to effects. Mark the causes as abducible, then ask for explanations of what was observed. Each explanation can be adopted, which predicts the other effects, or checked by asking for one more observation.</p>
{code("""
c.abduce('?s symptom of=$ion kind=cough')          // flu or allergy
c.fill('ion', 'season', 'winter');
c.abduce('?s symptom of=$ion kind=cough')          // flu: allergy is denied in winter
adopt(c, explanation);
c.ask('?s symptom of=$ion kind=?k')                // fever and cough are now predicted
""", "node examples/abduction.mjs")}
<p><strong>You bring.</strong> Costs or a <code>rank</code> function if some causes are more likely than others. The world says what is possible, not what is probable.</p>
<h2 id="learn">5. Building a matrix from examples</h2>
<p><strong>Pattern.</strong> Collect example circuits, induce slots and rules, review the text, tell it to a world. The world is the safety net: a learned rule that contradicts what is already there is refused, with the deny that it hit.</p>
{code("""
const slots = induceSlots(observedWires);
const rule  = induce(examples, { name: 'line_total', tolerant: true });
rule.skipped                        // examples that did not fit
const r = world.tell(rule.text);
r.ok || r.violations                // why the world does not accept the rule
""")}
<p><strong>You bring.</strong> Clean, grouped examples. Induction here is exact generalisation, without statistics.</p>
<h2 id="compose">6. Composing knowledge units</h2>
<p><strong>Pattern.</strong> Each micro-world is a matrix in a library. A world loads the ones it needs with <code>core.use</code>; their wires get the module name as an id prefix. Modules meet through shared types or through bridge rules.</p>
{code("""
const w = new World({ library: { garden, geo } });
w.load('@u1 core.use world=garden  @u2 core.use world=geo');
w.tell('@pl1 place name=lawn in=north  @f1 forecast region=north kind=rain');
w.ask('?s slippery place=?p')       // lawn
// derivation: garden.wet_slips <- garden.rain_wets <- geo.rain_over_region <- told
""", "node examples/compose.mjs")}
<p>Abduction, completion and retraction work across modules without extra code, because after loading there is one matrix.</p>
<h2 id="schedule">7. Scheduling and configuration</h2>
<p><strong>Pattern.</strong> Many open keys with closed domains and constraints between them: rooms and times, parts of a configuration, shifts. Ask for one full solution, or let the world commit one as assumptions that later statements can still replace.</p>
{code("""
const r = w.solveReport();          // { status: 'sat', assignment, stats, solver }
w.apply(r.assignment);              // all fills in one transaction
// or
w.complete({ choose: true });       // forced values first, then one full solution as assumptions
""", "node examples/solvers.mjs")}
<p>The search strategy is chosen when the world is created. See <a href="solvers.html">Solvers</a> for the built-in ones and for clingo and SAT solvers from outside.</p>
<h2>Choosing the calls</h2>
{table(['You want', 'Use'], [
 ['Set-up code that must not fail silently', '<code>load()</code>, which throws on refusal'],
 ['To try something without committing', '<code>{ dry: true }</code>'],
 ['One call per dialogue turn', '<code>step()</code>, then <code>answer()</code>'],
 ['State that changes over time', '<code>id=true</code> slot and <code>replace()</code>'],
 ['A what-if question', '<code>trial(fn)</code>'],
 ['To fill everything that is open', '<code>complete({ choose: true })</code> or <code>solve()</code> and <code>apply()</code>'],
 ['To keep a session', '<code>toJSON()</code> and <code>World.fromJSON()</code>'],
 ['To check files in CI', '<code>sopworld check matrix.sop facts.sop</code>'],
])}
''')

# ----------------------------------------------------------------------------- api
P['api.html'] = ('API', 'Everything exported by the package. Type declarations are in src/index.d.ts.', f'''
<h2>World</h2>
{code("""
new World({ fns, library, solver = solvers.nogood(), maxDepth = 12, maxSteps = 50000,
            lookahead = true, strict = false, searchBudget, rank })
""")}
{table(['Option', 'Meaning'], [
 ['<code>fns</code>', 'Functions for <code>core.calc</code> and <code>core.check</code>: <code>(args, world) =&gt; value</code>'],
 ['<code>library</code>', 'Matrix texts by name, loaded with <code>core.use</code>'],
 ['<code>maxDepth</code>', 'Longest chain of derivations'],
 ['<code>lookahead</code>', 'Suggestions must leave a full completion possible'],
 ['<code>strict</code>', 'Refuse changes that leave no possible completion'],
 ['<code>solver</code>', 'Search strategy for completion; see <a href="solvers.html">Solvers</a>'],
 ['<code>searchBudget</code>', 'Search nodes one solve may visit; each solver has its own default'],
 ['<code>rank</code>', '<code>(items, { kind, world }) =&gt; items</code>, reorders suggestions and explanations'],
])}
<h3>Writing</h3>
{table(['Method', 'Does'], [
 ['<code>tell(input, { dry, strict })</code>', 'Add facts and matrix wires, as text or wire objects'],
 ['<code>load(input)</code>', 'Like <code>tell</code>, throws when refused'],
 ['<code>fill(id, key, value, { dry, strict })</code>', 'Give a value to an open key'],
 ['<code>retract(id)</code>', 'Remove a told wire and what depends on it'],
 ['<code>replace(id, input)</code>', 'Swap a told wire for new wires in one transaction'],
 ['<code>apply(assignment)</code>', 'Commit an assignment from <code>solve</code> in one transaction'],
 ['<code>trial(fn)</code>', 'Run <code>fn(world)</code> and undo everything it did'],
 ['<code>use(name)</code>', 'Load a matrix from the library'],
 ['<code>step(input, { defaults, strict })</code>', '<code>tell</code> then <code>complete</code>'],
 ['<code>answer(question, value)</code>', 'Fill the key a <code>core.question</code> wire asks for'],
])}
<h3>Reading</h3>
{table(['Method', 'Returns'], [
 ['<code>get(id)</code>, <code>has(id)</code>, <code>ofType(type)</code>', 'Wires'],
 ['<code>ask(patterns)</code>', 'One object of bindings per match'],
 ['<code>holds(patterns)</code>', 'Boolean'],
 ['<code>explain(id)</code>', 'Justification tree'],
 ['<code>history()</code>', 'All events in order'],
 ['<code>on(listener)</code>', 'Unsubscribe function; the listener gets committed events'],
 ['<code>toSOP({ schema, derived, provenance })</code>', 'SOP Lang text, in order of arrival'],
 ['<code>toJSON()</code>, <code>World.fromJSON(data, options)</code>', 'Snapshot and restore'],
 ['<code>fork()</code>', 'Independent copy. Shares the state until one of the two changes, so it costs the same for any size of world'],
 ['<code>stats()</code>', '<code>{ steps, limit, exhausted, site, sites, ms }</code> of the last call'],
])}
<h3>Budgets</h3>
<p>Every call runs under a budget of steps, <code>{{ steps: 5000000 }}</code> by default. Set it for a world with <code>new World({{ budget: {{ steps, ms }} }})</code> or for one call with the <code>budget</code> option (<code>limit</code> for <code>solveReport</code>, where <code>budget</code> is the solver's own). A call that runs out stops, undoes what it did and says so in its normal result: a <code>budget</code> violation with the <code>site</code> where it stopped (<code>match</code>, <code>chase</code>, <code>negation</code>, <code>aggregate</code>, <code>fluent</code>, <code>withdraw</code>, <code>validate</code>, <code>complete</code>, <code>ground</code>, <code>solve</code>, <code>abduce</code>, <code>induce</code>), an empty list with a <code>budget</code> property, or <code>unknown</code> from a solver. It never hangs and never throws. Steps are counted, not timed, so the same call stops at the same place on any machine.</p>
<h3>Completion and abduction</h3>
{table(['Method', 'Returns'], [
 ['<code>open(id?)</code>', '<code>[{ id, type, key, ask }]</code>'],
 ['<code>suggest(id, key, { deep })</code>', '<code>[{ value, source, count }]</code>'],
 ['<code>next()</code>', '<code>{ fills, questions, dead }</code>'],
 ['<code>complete({ defaults })</code>', '<code>{ filled, questions, dead, pending }</code>'],
 ['<code>complete({ defaults, choose })</code>', 'As above; <code>choose</code> also commits one full solution'],
 ['<code>solve()</code>, <code>satisfiable()</code>', 'A joint assignment or <code>null</code>; boolean'],
 ['<code>solveReport({ solver, budget })</code>', '<code>{ status, assignment, stats, solver }</code>'],
 ['<code>solveAsync({ solver })</code>', 'The same, for solvers that answer with a promise'],
 ['<code>abduce(goal, { maxDepth, max, maxAssumptions })</code>', '<code>[{ assume, fills, text, cost }]</code>'],
])}
<h2>Functions</h2>
{table(['Function', 'Does'], [
 ['<code>parse(text)</code>, <code>format(wire)</code>', 'SOP Lang text to wire objects and back'],
 ['<code>str(value)</code>, <code>quote(text)</code>', 'Unquote and quote string values'],
 ['<code>induce(examples, { name, kind, why, tolerant, distinct, negatives })</code>', '<code>{ text, skipped, calcs, tests, coversNegative, variables, examples }</code>'],
 ['<code>induceRule(examples, options)</code>', 'The text only'],
 ['<code>induceSlots(wires, { enumMax, prefix })</code>', '<code>core.slot</code> text'],
 ['<code>adopt(world, explanation)</code>', 'Commit an explanation from <code>abduce</code>'],
 ['<code>solvers.backtrack()</code>, <code>solvers.nogood()</code>', 'Built-in search strategies'],
 ['<code>solvers.external({ run })</code>, <code>solvers.clingo({ exec })</code>, <code>solvers.dimacs({ exec })</code>', 'Strategies that use an outside solver'],
 ['<code>toASP(data)</code>, <code>toDimacs(data)</code>, <code>new Problem(world)</code>', 'The neutral problem and its encodings'],
 ['<code>quantity(value)</code>', '<code>{ n, unit }</code> for a number with an optional unit'],
])}
<h2>Violations</h2>
{table(['Kind', 'Meaning'], [
 ['<code>deny</code>', 'A <code>core.deny</code> matched; <code>rule</code>, <code>why</code>, <code>wires</code>'],
 ['<code>conflict</code>', 'A second value for a single-valued key; <code>have</code>, <code>want</code>'],
 ['<code>domain</code>', 'Value outside <code>enum</code>, or not a reference to the slot type'],
 ['<code>cardinality</code>', 'Several values on a key that is not <code>many</code>'],
 ['<code>unknown-key</code>', 'Key without a slot on a closed type'],
 ['<code>dangling-ref</code>', 'Reference to a wire that does not exist'],
 ['<code>dead-end</code>', 'Strict mode: no completion possible'],
 ['<code>duplicate-id</code>, <code>syntax</code>, <code>schema</code>', 'The input itself is wrong'],
 ['<code>depth</code>', 'A derivation ran away'],
 ['<code>budget</code>', 'The call ran out of steps (or of <code>ms</code>); <code>site</code> says where'],
 ['<code>unknown-wire</code>, <code>unsupported</code>', 'The wire cannot be filled or retracted'],
])}
<h2>Command line</h2>
{code("""
sopworld check <file.sop ...>                  exit 1 when anything is refused
sopworld run   <file.sop ...> [--defaults] [--provenance]
sopworld ask   <file.sop ...> --query "?a acceleration magnitude=?v"
options: --strict --json
""")}
<h2>Source layout</h2>
{table(['File', 'Responsibility'], [
 ['<code>parser.mjs</code>', 'Text to wires and back'],
 ['<code>unify.mjs</code>', 'Terms and unification'],
 ['<code>matrix.mjs</code>', 'Compiles matrix wires into slots, rules, denies; module prefixing'],
 ['<code>world.mjs</code>', 'Store, indexes, transactions, ingest, matching, chase, validation, withdrawal'],
 ['<code>complete.mjs</code>', 'Open keys, suggestions, questions, dialogue helpers'],
 ['<code>solve.mjs</code>', 'The completion problem in neutral form and the solver strategies'],
 ['<code>revise.mjs</code>', 'Retraction, replacement, revision of assumptions'],
 ['<code>abduce.mjs</code>, <code>induce.mjs</code>', 'Abduction and induction'],
 ['<code>builtins.mjs</code>', 'Calc and test functions, quantities with units'],
 ['<code>tools/build.mjs</code>', 'Bundles <code>src/</code> into <code>docs/sopworld.mjs</code> and <code>docs/sopworld.js</code>'],
 ['<code>node/solvers.mjs</code>', 'Starts clingo or a SAT solver as a process (Node only)'],
])}
''')

# ----------------------------------------------------------------------------- roadmap
P['roadmap.html'] = ('Analysis and roadmap', 'Where the library stands against the goal: a self-consistent model of a small world that completes itself logically, explains itself, and can be learned from examples.', f'''
<h2>What is settled</h2>
<p>These decisions held through four iterations and the tests rely on them. Treat them as the architecture.</p>
<ul>
 <li><strong>One language.</strong> Facts, schema, rules and constraints are all wires. A matrix can be stored, sent, diffed and learned like data.</li>
 <li><strong>One operation.</strong> Every change is a transaction of ingest, chase, validate. Dry runs, completion search, abduction checks and what-if trials are the same operation on a state that is rolled back.</li>
 <li><strong>Declarative rules, named code.</strong> Functions are the only place for code.</li>
 <li><strong>Open world, explicit questions.</strong> Missing is unknown. Required keys make the unknown visible as questions.</li>
 <li><strong>Provenance on everything.</strong> Wires, values and rule firings record their sources. Explanation, incremental retraction, revision of assumptions and the conflict analysis of the solvers all read that record.</li>
 <li><strong>Three strengths of belief.</strong> Told, derived or forced, and assumed. Only assumptions give way.</li>
 <li><strong>The world is the judge.</strong> Search is a strategy. Whatever a solver proposes, built in or outside, is accepted only after the world has verified it.</li>
 <li><strong>One file.</strong> The sources are small modules; the product is one file that runs unchanged in Node and in a browser.</li>
</ul>
<h2>What this iteration added</h2>
{table(['Earlier limit', 'Now'], [
 ['Several modules, Node only in practice', 'A dependency-free build makes <code>sopworld.mjs</code> and <code>sopworld.js</code>; the whole test suite runs on the built file, and a self-test runs in the browser'],
 ['Completion search was one built-in backtracker', 'The solver is a strategy: a minimal backtracker, a clause-learning SAT solver in plain JavaScript (the default), and adapters for clingo and any DIMACS SAT solver'],
 ['Search asked the world at every step', 'Deny constraints are grounded once into nogoods; the default solver asks the world only to verify a complete answer'],
 ['Every deny was re-checked in full after each change', 'A deny without negation is checked only from the wires that changed'],
 ['Each binding copied the whole substitution', 'Substitutions are shared linked lists; single-valued keys are matched in a plain loop'],
 ['<code>replace</code> dropped wires that referred to the old wire', 'They stay when the new wire keeps the id'],
 ['Free numeric keys could not be searched', '<code>min</code>, <code>max</code>, <code>step</code> make a numeric key enumerable; <code>min</code> and <code>max</code> are validated'],
 ['Atoms were opaque', 'Numbers carry units through the built-in functions'],
 ['Induction could not use negative examples', 'It adds the comparisons that exclude them, and requires same-type patterns to match different wires'],
 ['A refusal named derived wires', 'Each violation lists the told wires it rests on'],
])}
<h2>Measured</h2>
<p>One run on the development machine (Node 22). Treat the numbers as orders of magnitude.</p>
{table(['Workload', 'Before this iteration', 'Now'], [
 ['Six dialogue turns of meeting completion', '828 ms', '139 ms'],
 ['3000 facts joined into 3000 derived wires', '186 ms', '171 ms'],
 ['14,000 wires through a recursive rule', '451 ms', '366 ms'],
 ['Retract one fact among 14,000 wires', '6 ms', '4 ms'],
 ['Schedule 16 meetings, 5 rooms (32 open keys)', 'no answer within 2000 search steps (1.3 s)', '25 ms'],
])}
<h2>What is still limited</h2>
{table(['Limit', 'Consequence', 'What would fix it'], [
 ['Matching does not cache partial matches', 'Each change re-joins from the changed wire. Fine for tens of thousands of wires, slow for rules with many patterns over large types', 'A Rete or TREAT network behind the same matching interface'],
 ['Only denies are grounded for the solver', 'A conflict that arises through a rule is found when the world verifies an answer, one refusal at a time', 'Ground rule consequences too (labels of assumptions, as in an ATMS)'],
 ['Grounding grows with the number of deny matches', 'Capped at 200,000 nogoods; beyond that the world verifies the rest', 'Hand the deny itself to an outside solver instead of its ground instances'],
 ['With negation a partial completion may be refused although a later value would repair it', 'Such completions are not found', 'Check only complete assignments for matrices with negation'],
 ['Free keys cannot be enumerated', 'They always become questions', 'Interval propagation for numbers'],
 ['Ranking is counts and declared costs', 'The world knows possible, not probable', 'A learned scorer through the <code>rank</code> hook'],
 ['Induction is exact', 'One wrong example changes the rule; no learned negation', 'Scoring rule candidates against the examples'],
 ['No notion of time or context', 'Time is a value you manage; a wire holds everywhere', '<code>core.in</code> contexts and validity intervals'],
 ['The build does not minify', '110 kB, 31 kB gzipped', 'An optional minifier outside the repository'],
])}
<h2>Is a neural part needed</h2>
<p>Not for validity. Matching, completion, search, abduction, induction and revision are symbolic and exact. A statistical part earns its place at four edges, and the library has a seam for each:</p>
{table(['Edge', 'Seam in the library'], [
 ['Text to wires', '<code>tell</code> accepts wire objects; refusals come back as data, with the told wires they rest on'],
 ['Wires to text', '<code>core.question</code> wires carry <code>ask</code>, options and the wire they are about'],
 ['Which of several consistent options is likely', '<code>rank</code> option, <code>cost</code> on abducibles'],
 ['Fuzzy equality of atoms', 'A custom <code>core.check</code> function'],
])}
<h2>Recommended order of work</h2>
<ol>
 <li><strong>Formaliser contract.</strong> Fix the loop of propose wires, read violations and their support, repair. It decides how good completion feels in a real chat, and it needs no engine change.</li>
 <li><strong>Contexts.</strong> <code>core.in=$ctx</code> with rules that hold per context: nested worlds, hypothetical branches, per-speaker beliefs.</li>
 <li><strong>Grounding of rule consequences.</strong> So that the solver sees conflicts that arise through rules before it proposes an answer.</li>
 <li><strong>Match network.</strong> Only when a real matrix shows the need; measure first with <code>npm run bench</code>.</li>
 <li><strong>Induction with scoring.</strong> Noise and learned negation, using the world itself as the judge of candidate rules.</li>
</ol>
<h2>How to judge progress</h2>
<ul>
 <li>Every new capability lands with a small world in <code>examples/</code> and a test that states the expected wires.</li>
 <li>Anything incremental is tested against a rebuild from scratch; every solver against a reference solver.</li>
 <li>The suite must pass on the sources and on the built file, and the self-test in a browser.</li>
 <li>A matrix written by a person for a new domain should need no change in <code>src/</code>. When it does, that is the next item for this page.</li>
</ul>
''')

# ----------------------------------------------------------------------------- solvers
P['solvers.html'] = ('Solvers', 'Filling many open keys at once is a search problem. The world states the problem in a neutral form and a solver, chosen when the world is created, searches it. The world verifies every answer.', f'''
<h2>The problem in neutral form</h2>
{table(['Part', 'What it is'], [
 ['Variables', 'One per open key with a closed domain (<code>enum</code>, wires of a <code>type</code>, or a stepped range). The domain holds the values the world accepts one at a time'],
 ['Nogoods', 'Combinations of values that a deny rules out. All candidate values are put on their wires at once and each deny is matched once; every match names the values it used'],
 ['Oracle', 'The world itself: <code>push</code> and <code>pop</code> one value, or <code>verify</code> a whole assignment. A refusal names the variables that caused it'],
])}
{code("""
import { World, Problem } from './sopworld.mjs';
const p = new Problem(world);
p.variables      // [{ index, id, key, type, domain }]
p.nogoods        // [[{ v: 1, value: 't1' }, { v: 3, value: 't1' }], ...]
p.toJSON()       // plain data for a solver outside the process
""")}
<h2>Choosing a solver</h2>
{code("""
import { World, solvers } from './sopworld.mjs';

new World()                                        // solvers.cdcl(), the default
new World({ solver: solvers.backtrack() })
world.solveReport({ solver: solvers.backtrack() }) // or per call
""")}
{table(['Solver', 'Runs', 'How it works', 'Use it when'], [
 ['<code>solvers.cdcl()</code>', 'Node and browsers', 'Nogoods and "exactly one value per key" become clauses for a built-in clause-learning SAT solver. The world verifies complete answers; a refusal becomes one more clause', 'Always, unless you have a reason not to. It is the default'],
 ['<code>solvers.backtrack()</code>', 'Node and browsers', 'Depth-first, smallest live domain first, every step checked by the world. No grounding, no memory', 'Tiny problems, or as a reference when testing another solver'],
 ['<code>solvers.clingo({ exec })</code>', 'Wherever clingo runs', 'The neutral problem as an answer set program', 'You already run clingo, or want its optimisation and enumeration next'],
 ['<code>solvers.dimacs({ exec })</code>', 'Wherever a SAT solver runs', 'The neutral problem as DIMACS CNF', 'You want an industrial SAT solver'],
 ['<code>solvers.external({ run })</code>', 'Anywhere', 'You receive the neutral problem and return one value per variable', 'Any other engine: CP-SAT, MiniZinc, a service'],
])}
<h2>Outside solvers on Node</h2>
<p>The encodings and the verification loop are in the library. Starting a process is the only Node-specific part, so it lives in a separate small file.</p>
{code("""
import { World } from './docs/sopworld.mjs';
import { clingoProcess, dimacsProcess } from './node/solvers.mjs';

const world = new World({ solver: clingoProcess() });                    // `clingo` on the PATH
const other = new World({ solver: dimacsProcess({ command: 'kissat', args: ['-q'] }) });
""")}
<p>Or wire it yourself in three lines:</p>
{code("""
import { spawnSync } from 'node:child_process';
const solver = solvers.clingo({
  exec: (program) => spawnSync('clingo', ['--outf=0', '-'], { input: program, encoding: 'utf8' }).stdout,
});
""")}
<h2>Outside solvers in a browser</h2>
<p>A WebAssembly solver answers with a promise. Return the promise from <code>exec</code> or <code>run</code> and use <code>solveAsync</code>; the rest of the API stays synchronous.</p>
{code("""
const solver = solvers.clingo({ exec: (program) => runClingoWasm(program) });   // returns a promise
const r = await world.solveAsync({ solver });
if (r.status === 'sat') world.apply(r.assignment);
""")}
<div class="note">The asynchronous path is tested with a stand-in solver in Node and in Chrome. It has not been run against a real WebAssembly build of clingo.</div>
<h2>What the world guarantees</h2>
<ul>
 <li><strong>No wrong answers.</strong> An assignment is returned only after the world has applied it in a scratch transaction without a violation.</li>
 <li><strong>Refusals teach.</strong> When the world refuses a proposal, the values that caused it are sent back as a nogood and the solver is asked again. A test feeds the library a solver that ignores the constraints on its first answer and checks that the final answer is right.</li>
 <li><strong>Three outcomes.</strong> <code>sat</code>, <code>unsat</code>, or <code>unknown</code> when the budget ran out. Completion treats <code>unknown</code> as "still possible".</li>
 <li><strong>Nothing changes.</strong> Solving leaves the world as it was. <code>apply</code> or <code>complete({{ choose: true }})</code> commit.</li>
</ul>
<h2>Measured</h2>
<p>Scheduling meetings into rooms and four times, with capacity, double booking and "one person, one place" constraints. One run of <code>node examples/solvers.mjs</code> on the development machine, with clingo 5.8 and CaDiCaL started as processes. Times include building the problem.</p>
{table(['Instance', 'backtrack', 'cdcl', 'clingo', 'CaDiCaL'], [
 ['12 meetings, 4 rooms (24 keys), satisfiable', '416 ms, 22,831 world checks', '22 ms, 24 checks', '80 ms', '59 ms'],
 ['16 meetings, 5 rooms (32 keys), satisfiable', 'no answer in 2000 steps, 1.3 s', '25 ms', '107 ms', '87 ms'],
 ['24 meetings, 8 rooms (48 keys), satisfiable', 'not run', '93 ms', '304 ms', '166 ms'],
 ['40 meetings, 12 rooms (80 keys), unsatisfiable', 'not run', '235 ms', '762 ms', '258 ms'],
])}
<ul>
 <li>All four agree on every instance tried, and every answer is accepted by the world. The suite repeats this on 14 small instances for all solvers and on 40 instances for the built-in SAT solver against CaDiCaL.</li>
 <li>At these sizes most of the time is building the problem, and starting a process costs more than the search. On the instances tried, no outside solver was faster than the built-in one. They are there for problems the built-in solver returns <code>unknown</code> on, and for engines you already depend on.</li>
</ul>
<h2>Writing a solver</h2>
{code("""
const mine = {
  name: 'mine',
  solve(problem, { preset, budget }) {
    // preset: Map(variable index -> value) that must hold
    // use problem.variables, problem.nogoods, problem.push / pop / verify
    return { status: 'sat', assignment: problem.toAssignment(values), stats: {} };
  },
};
""")}
<p><code>Sat</code>, the clause-learning solver itself, is exported too and can be used on its own: <code>new Sat(n)</code>, <code>addClause([1, -2])</code>, <code>solve(budget)</code>, <code>model()</code>.</p>
''')

PLAY = '''
<div class="pg">
 <section>
  <h2>1. Matrix</h2>
  <label for="preset">Example world</label>
  <select id="preset"></select>
  <label for="matrix">Slots, rules and denies</label>
  <textarea id="matrix" rows="16" spellcheck="false"></textarea>
  <label for="solver">Solver</label>
  <select id="solver"><option value="cdcl">cdcl (default)</option><option value="backtrack">backtrack</option></select>
  <div class="row"><button type="button" id="load" class="primary">Load matrix into a new world</button></div>
 </section>
 <section>
  <h2>2. Tell and ask</h2>
  <label for="facts">Facts to tell</label>
  <textarea id="facts" rows="7" spellcheck="false"></textarea>
  <div class="row">
   <button type="button" id="tell" class="primary">Tell</button>
   <button type="button" id="complete">Complete</button>
   <button type="button" id="solve">Solve</button>
   <button type="button" id="choose">Choose a full solution</button>
  </div>
  <label for="query">Pattern, goal or wire id</label>
  <textarea id="query" rows="3" spellcheck="false"></textarea>
  <div class="row">
   <button type="button" id="ask">Ask</button>
   <button type="button" id="abduce">Abduce</button>
   <button type="button" id="explain">Explain id</button>
   <button type="button" id="retract">Retract id</button>
  </div>
  <h2>Open keys</h2>
  <ul id="open"></ul>
 </section>
 <section>
  <h2>3. The world</h2>
  <p id="status"></p>
  <pre id="state"></pre>
  <h2>What happened</h2>
  <div id="log" aria-live="polite"></div>
 </section>
</div>
'''
P['playground.html'] = ('Playground', 'A world running in this page from the single-file build. Pick an example, tell it facts, and click an option to answer what it asks.', PLAY)
TAILS = {'playground.html': '<script type="module" src="playground.js"></script>'}

SELF = '''
<p id="summary">Running the checks...</p>
<ul class="results" id="results"></ul>
<h2>What this runs</h2>
<p>The page imports <code>sopworld.mjs</code> as an ES module and runs <code>selftest.mjs</code>: deduction, refusal, completion, abduction, induction, retraction, replacement, negation, composition, persistence and both built-in solvers. It also loads <code>sopworld.js</code> as a classic script and checks the global. The same file runs in Node with <code>node docs/selftest.mjs</code>.</p>
'''
SELFTAIL = '''<script src="sopworld.js"></script>
<script type="module">
import { run } from './selftest.mjs';
import { version } from './sopworld.mjs';
const list = document.getElementById('results');
const add = (ok, text, detail) => {
  const li = document.createElement('li');
  if (!ok) li.className = 'bad';
  li.textContent = text;
  if (detail) { const s = document.createElement('small'); s.textContent = ' ' + detail; li.append(s); }
  list.append(li);
};
const report = await run();
for (const r of report.results) add(r.ok, r.name, r.ok ? r.ms + ' ms' : r.error);
const classic = typeof sopworld === 'object' && sopworld.version === version && typeof sopworld.World === 'function';
add(classic, 'the classic script exposes the same library as a global', classic ? '' : 'window.sopworld is missing or differs');
const failed = report.failed + (classic ? 0 : 1);
const summary = document.getElementById('summary');
summary.textContent = `sopworld ${version}: ${report.passed + (classic ? 1 : 0)} passed, ${failed} failed`;
summary.dataset.done = failed ? 'failed' : 'passed';
</script>'''
P['selftest.html'] = ('Self-test', 'The built file checking itself in this browser.', SELF)
TAILS['selftest.html'] = SELFTAIL

OUT.mkdir(exist_ok=True)
(OUT / 'style.css').write_text(CSS)
titles = dict(PAGES)
for fname, (title, lead, body) in P.items():
    (OUT / fname).write_text(page(fname, title, lead, body, tail=TAILS.get(fname, ''), wide=(fname == 'playground.html')))
print(sorted(p.name for p in OUT.iterdir()))
