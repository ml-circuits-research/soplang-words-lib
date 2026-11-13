# Builds the HTML pages of sopworld into docs/ (python3 tools/build_docs.py).
# The text has one source: the markdown files. Each page below is generated from one of
# them; only the playground and the self-test, which are programs, are written here.
# Run it when a markdown file changes; test/docs.test.mjs fails when a page is stale.
import hashlib, html, json, pathlib, re, textwrap
OUT = pathlib.Path(__file__).resolve().parent.parent / 'docs'
ROOT = OUT.parent
# (page, title in the navigation, the markdown file it is generated from)
SOURCES = [('index.html', 'Overview', 'SPEC.md'), ('language.html', 'Language', 'docs/language.md'),
           ('reference.html', 'Reference', 'docs/reference.md'), ('semantics.html', 'Semantics', 'docs/semantics.md'),
           ('api.html', 'API', 'docs/api.md'), ('glossary.html', 'Glossary', 'docs/glossary.md'),
           ('integration.html', 'Integration', 'docs/integration.md'), ('capabilities.html', 'Capabilities', 'docs/capabilities.md'), ('quickstart.html', 'Quickstart', 'docs/quickstart.md'), ('modules.html', 'Modules', 'docs/modules.md'), ('patterns.html', 'Patterns', 'docs/patterns.md'), ('host-contract.html', 'Host contract', 'docs/host-contract.md'), ('lessons.html', 'Lessons', 'docs/lessons.md')]
PAGES = [(f, t) for f, t, _ in SOURCES] + [('playground.html', 'Playground')]
VERSION = json.loads((ROOT / 'package.json').read_text())['version']

def code(text, label=None):
    body = html.escape(textwrap.dedent(text).strip('\n'))
    cap = f'<figcaption>{html.escape(label)}</figcaption>' if label else ''
    return f'<figure class="code">{cap}<pre><code>{body}</code></pre></figure>'

def table(head, rows):
    h = ''.join(f'<th>{c}</th>' for c in head)
    b = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'<div class="table"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'

def page(fname, title, lead, body, tail='', wide=False, source_hash=None):
    nav = ''.join(f'<a href="{f}"{" aria-current=\"page\"" if f == fname else ""}>{t}</a>' for f, t in PAGES)
    doc_title = 'sopworld' if fname == 'index.html' else 'sopworld ' + re.sub(r'<[^>]+>', '', title).split(':')[0]
    stamp = f'\n<meta name="source-hash" content="{source_hash}">' if source_hash else ''
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{doc_title}</title>{stamp}
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
{f'<h1>{title}</h1>' if title else ''}
{f'<p class="lead">{lead}</p>' if lead else ''}
{body}
</main>
<footer>sopworld {VERSION} · consistency matrices for SOP Lang circuits · one file, no dependencies, Node and browsers · <a href="selftest.html">self-test</a></footer>
{tail}
</body>
</html>
'''

CSS = r'''/* sopworld documentation (written by tools/build_docs.py)
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
.source { margin-top: 3rem; font-size: 0.8rem; color: var(--muted); }
h2[id], h3[id] { scroll-margin-top: 1rem; }
'''


# ---- markdown to HTML: the subset the documentation uses -----------------------------------
def slug(text):
    """The anchor GitHub gives a heading, so links work in both renderings."""
    text = re.sub(r'`|\*', '', text).strip().lower()
    return re.sub(r'\s', '-', re.sub(r'[^\w\s-]', '', text))

def link(href, source):
    """A link written for the markdown file, as it must be from a page in docs/."""
    if re.match(r'^(https?:|mailto:|#)', href): return href
    path, _, anchor = href.partition('#')
    target = (ROOT / source).parent.joinpath(path).resolve() if path else None
    for page, _, src in SOURCES:
        if target == (ROOT / src).resolve(): return page + ('#' + anchor if anchor else '')
    rel = pathlib.PurePosixPath(*pathlib.Path(__import__('os').path.relpath(target, OUT)).parts)
    return str(rel) + ('#' + anchor if anchor else '')

def inline(text, source):
    out, pos = [], 0
    for m in re.finditer(r'(`+)(.+?)\1', text):                      # code spans are literal
        out.append(('t', text[pos:m.start()])); out.append(('c', m.group(2))); pos = m.end()
    out.append(('t', text[pos:]))
    def plain(t):
        t = html.escape(t, quote=False)
        t = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: f'<a href="{html.escape(link(m.group(2), source))}">{m.group(1)}</a>', t)
        t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
        return re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', t)
    # links may wrap code spans: mark the spans, format, then put them back
    marked = ''.join(t if k == 't' else f'\x00{i}\x00' for i, (k, t) in enumerate(out))
    res = plain(marked)
    return re.sub(r'\x00(\d+)\x00', lambda m: '<code>' + html.escape(out[int(m.group(1))][1], quote=False) + '</code>', res)

def cells(row):
    return [c.strip().replace('\\|', '|') for c in re.split(r'(?<!\\)\|', row.strip().strip('|'))]

def render(text, source):
    """Markdown to (title, lead, body). Headings, paragraphs, lists, tables, fenced code."""
    lines, out, i = text.split('\n'), [], 0
    title = lead = None
    while i < len(lines):
        line = lines[i]
        if not line.strip(): i += 1; continue
        fence = re.match(r'^(`{3,})(.*)$', line)
        if fence:
            j = i + 1
            while j < len(lines) and not lines[j].startswith(fence.group(1)): j += 1
            info = fence.group(2).strip()
            label = {'output': 'prints', 'js run': 'js (run by the tests)', 'js setup': 'js (used by the examples below)'}.get(info, info or None)
            body = html.escape('\n'.join(lines[i + 1:j]))
            cap = f'<figcaption>{html.escape(label)}</figcaption>' if label else ''
            out.append(f'<figure class="code">{cap}<pre><code>{body}</code></pre></figure>')
            i = j + 1; continue
        h = re.match(r'^(#{1,4}) (.*)$', line)
        if h:
            n, t = len(h.group(1)), h.group(2)
            if n == 1 and title is None: title = inline(t, source)
            else: out.append(f'<h{n} id="{slug(t)}">{inline(t, source)}</h{n}>')
            i += 1; continue
        if line.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:|-]+\|$', lines[i + 1].strip()):
            head, rows, j = cells(line), [], i + 2
            while j < len(lines) and lines[j].startswith('|'): rows.append(cells(lines[j])); j += 1
            out.append(table([inline(c, source) for c in head], [[inline(c, source) for c in r] for r in rows]))
            i = j; continue
        item = re.match(r'^(\s*)(-|\d+\.) (.*)$', line)
        if item:
            tag, items, j = ('ul' if item.group(2) == '-' else 'ol'), [], i
            while j < len(lines):
                m = re.match(r'^(-|\d+\.) (.*)$', lines[j])
                if m: items.append(m.group(2)); j += 1
                elif lines[j].startswith('  ') and lines[j].strip() and items: items[-1] += ' ' + lines[j].strip(); j += 1
                else: break
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(x, source)}</li>' for x in items) + f'</{tag}>')
            i = j; continue
        j, para = i, []
        while j < len(lines) and lines[j].strip() and not re.match(r'^(`{3,}|#{1,4} |\||- |\d+\. )', lines[j]): para.append(lines[j].strip()); j += 1
        p = inline(' '.join(para), source)
        if lead is None and title is not None and not out: lead = p
        else: out.append(f'<p>{p}</p>')
        i = j
    return title, lead, '\n'.join(out)

P, HASHES = {}, {}
for fname, nav_title, source in SOURCES:
    title, lead, body = render((ROOT / source).read_text(), source)
    P[fname] = (title or nav_title, lead or '', body + f'\n<p class="source">Generated from <code>{source}</code>.</p>')
    HASHES[fname] = hashlib.sha256((ROOT / source).read_bytes()).hexdigest()[:12]

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
for fname, (title, lead, body) in P.items():
    (OUT / fname).write_text(page(fname, title, lead, body, tail=TAILS.get(fname, ''), wide=(fname == 'playground.html'), source_hash=HASHES.get(fname)))
generated = set(P) | {'style.css'}
for old in OUT.glob('*.html'):
    if old.name not in generated: old.unlink(); print('removed', old.name)
print(sorted(p.name for p in OUT.iterdir()))
