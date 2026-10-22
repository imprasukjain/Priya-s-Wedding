// Builds the static site into dist/.
//   node scripts/build.mjs            -> preview build (with a "Preview" banner)
//   PREVIEW=false node scripts/build.mjs -> public build used by GitHub Pages
// Every build is marked noindex: guests get the link directly, and the page
// lists family phone numbers, so it should not show up in search results.
//   THEME=minimal node scripts/build.mjs
// Also writes dist/embedded/index.html: a single-file variant for the private
// claude.ai preview (inlined CSS/JS; downloads, print, map embeds, share sheet off).
//
// Each language in content/i18n/ is written to its own folder: English at the
// root, Hindi at hi/, Bangla at bn/. Untranslated event text is listed as a
// warning and shown in English rather than failing the build.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { loadValidatedData } from '../src/lib/load-data.mjs';
import { toPublicData } from '../src/lib/public-data.mjs';
import { renderPage } from '../src/lib/render.mjs';
import { renderIcs } from '../src/lib/ics.mjs';
import { LANGUAGES, loadLanguage } from '../src/lib/i18n.mjs';

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
  writeFile(new URL('styles.css', out), css),
  writeFile(new URL('app.js', out), js),
]);

for (const code of LANGUAGES) {
  const lang = loadLanguage(code);
  const dir = new URL(lang.dir, out);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('index.html', dir), renderPage(pub, { lang, generatedAt, preview }));
  await writeFile(new URL('schedule.ics', dir), renderIcs(pub, generatedAt, lang));
  if (code === 'en') {
    await writeFile(new URL('embedded/index.html', out),
      renderPage(pub, { lang, generatedAt, preview, embedded: true, inlineCss: css, inlineJs: js }));
  }
  if (lang.missingContent.size) {
    console.warn(`WARN: ${code} has no translation for ${lang.missingContent.size} text(s); showing English:`);
    for (const text of lang.missingContent) console.warn(`  - ${JSON.stringify(text)}`);
  }
}

const counts = pub.days.map((d) => `${d.date}: ${d.items.length}`).join(', ');
console.log(`Built dist/ in ${LANGUAGES.join(', ')} (theme: ${theme}${preview ? ', preview' : ''}) — public items ${counts}`);
