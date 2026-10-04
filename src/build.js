// Bygger hver quiz i src/quizzes/*.json til <navn>/index.html og laver forsiden.
// Kør: node src/build.js
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const ROOT = path.join(SRC, '..');
const font = (f) => fs.readFileSync(path.join(SRC, 'fonts', f)).toString('base64');
const css = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8')
  .replace('__FONT_LIGHT__', font('Selawik-Light.woff2'))
  .replace('__FONT_REGULAR__', font('Selawik-Regular.woff2'))
  .replace('__FONT_BOLD__', font('Selawik-Bold.woff2'));
const app = fs.readFileSync(path.join(SRC, 'quiz.js'), 'utf8');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function page(title, body, script) {
  return `<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
${css}</style>
</head>
<body>
${body}
${script ? `<script>\n${script}</script>\n` : ''}</body>
</html>
`;
}

const quizzes = [];
for (const file of fs.readdirSync(path.join(SRC, 'quizzes')).filter((f) => f.endsWith('.json')).sort()) {
  const slug = file.replace(/\.json$/, '');
  const quiz = JSON.parse(fs.readFileSync(path.join(SRC, 'quizzes', file), 'utf8'));
  const data = 'const QUIZ = ' + JSON.stringify(quiz).replace(/</g, '\\u003c') + ';\n';
  const html = page(`Quiz: ${quiz.titel}`,
    '<div class="progress" aria-hidden="true"><span></span></div>\n<main id="app" aria-live="polite"></main>',
    data + app);
  fs.mkdirSync(path.join(ROOT, slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, slug, 'index.html'), html);
  quizzes.push({ slug, emoji: quiz.emoji || '📝', titel: quiz.titel, undertitel: quiz.undertitel || '', fag: quiz.fag || '', n: quiz.spoergsmaal.length });
  console.log(`${slug}/index.html  ${quiz.spoergsmaal.length} spørgsmål`);
}

const list = quizzes.map((q) => `    <li><a href="${q.slug}/"><span>${esc(q.emoji)} ${esc(q.titel)}</span><small>${esc(q.fag)}, ${q.n} spørgsmål</small></a></li>`).join('\n');
fs.writeFileSync(path.join(ROOT, 'index.html'), page('Cyber-quizzer', `<main>
  <section class="intro">
    <p class="face" aria-hidden="true">:)</p>
    <h1>Cyber-quizzer</h1>
    <p class="lede">Små quizzer til opsamling i it-sikkerhed. Ét spørgsmål ad gangen, med forklaring efter hvert svar.</p>
    <ul class="quizlist">
${list}
    </ul>
  </section>
</main>`));
console.log('index.html');

// README: tabellen mellem markørerne genereres, så links og emojis altid passer til quizzerne.
const BASE = 'https://andracs.github.io/cyber-quizzer/';
const rows = quizzes.map((q) => `| ${q.emoji} | [${q.titel}](${BASE}${q.slug}/) | ${q.fag} | ${q.n} | \`${BASE}${q.slug}/\` |`);
const table = ['<!-- quizzer:start -->', '| | Quiz | Fag | Spørgsmål | Link |', '|---|------|-----|-----------|------|', ...rows, '<!-- quizzer:end -->'].join('\n');
const readmePath = path.join(ROOT, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
if (readme.includes('<!-- quizzer:start -->')) {
  readme = readme.replace(/<!-- quizzer:start -->[\s\S]*<!-- quizzer:end -->/, table);
} else {
  readme = readme.replace(/\| Quiz \| Fag[\s\S]*?\n(?=\n)/, table + '\n');
}
fs.writeFileSync(readmePath, readme);
console.log('README.md');
