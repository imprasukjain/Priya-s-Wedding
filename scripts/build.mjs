// Builds the static site into dist/.
//   node scripts/build.mjs            -> preview build (noindex + preview banner)
//   THEME=minimal node scripts/build.mjs
// Also writes dist/embedded/index.html: a single-file variant for the private
// claude.ai preview (inlined CSS/JS; downloads, print, map embeds, share sheet off).
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { loadValidatedData } from '../src/lib/load-data.mjs';
import { toPublicData } from '../src/lib/public-data.mjs';
import { renderPage } from '../src/lib/render.mjs';
import { renderIcs } from '../src/lib/ics.mjs';

const root = new URL('../', import.meta.url);
const out = new URL('dist/', root);
const theme = process.env.THEME || 'minimal';
const preview = process.env.PREVIEW !== 'false';

const { eventData, updates } = await loadValidatedData();
const pub = toPublicData(eventData, updates);
const generatedAt = new Date();

const js = await readFile(new URL('src/assets/app.js', root), 'utf8');
const css = (
  await Promise.all([
    readFile(new URL(`src/themes/${theme}.css`, root), 'utf8'),
    readFile(new URL('src/assets/base.css', root), 'utf8'),
  ])
).join('\n');

await rm(out, { recursive: true, force: true });
await mkdir(new URL('embedded/', out), { recursive: true });
await Promise.all([
  writeFile(new URL('index.html', out), renderPage(pub, { generatedAt, preview })),
  writeFile(new URL('embedded/index.html', out),
    renderPage(pub, { generatedAt, preview, embedded: true, inlineCss: css, inlineJs: js })),
  writeFile(new URL('styles.css', out), css),
  writeFile(new URL('app.js', out), js),
  writeFile(new URL('schedule.ics', out), renderIcs(pub, generatedAt)),
]);

const counts = pub.days.map((d) => `${d.date}: ${d.items.length}`).join(', ');
console.log(`Built dist/ (theme: ${theme}${preview ? ', preview' : ''}) — public items ${counts}`);
