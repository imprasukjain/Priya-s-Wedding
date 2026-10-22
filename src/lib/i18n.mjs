// Languages for the guest site. Each language lives in content/i18n/<code>.json:
//   ui      – every interface string, keyed (English is the reference set)
//   content – translations of text that comes from event-data.json, keyed by
//             the English text itself ("Outer Hall": "आउटर हॉल")
//   format  – month/weekday names and the words for parts of the day
//   keepAsWritten – names and addresses deliberately left as written (hotels,
//             postal addresses), so they match signboards and maps
//
// A missing ui key is a code bug and fails the build. A missing content
// translation falls back to English and is reported as a warning, so an
// urgent schedule change is never blocked waiting for a translation.
import { readFileSync } from 'node:fs';
import { makeFormat } from './format.mjs';

export const LANGUAGES = ['en', 'hi', 'bn'];

const root = new URL('../../', import.meta.url);
const readLang = (code) => JSON.parse(readFileSync(new URL(`content/i18n/${code}.json`, root), 'utf8'));

/** Directory a language is published under, relative to the site root. */
export const langDir = (code) => (code === 'en' ? '' : `${code}/`);

export function loadLanguage(code) {
  const english = readLang('en');
  const data = code === 'en' ? english : readLang(code);

  const missingKeys = Object.keys(english.ui).filter((k) => !(k in data.ui));
  if (missingKeys.length) {
    throw new Error(`content/i18n/${code}.json is missing ui strings: ${missingKeys.join(', ')}`);
  }

  const missingContent = new Set();
  const keep = new Set(data.keepAsWritten ?? []);

  /** Interface string with {placeholders} filled in. Returns plain text. */
  const t = (key, vars = {}) => {
    const template = data.ui[key];
    if (typeof template !== 'string') throw new Error(`Unknown ui string "${key}"`);
    return template.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
  };

  /** Translation of a piece of event content, falling back to the English text. */
  const tc = (text) => {
    if (text == null || code === 'en') return text;
    if (Object.hasOwn(data.content, text)) return data.content[text];
    if (keep.has(text)) return text;
    missingContent.add(text);
    return text;
  };

  return {
    code,
    name: data.name,
    htmlLang: data.htmlLang,
    dir: langDir(code),
    ui: data.ui,
    t,
    tc,
    fmt: makeFormat(data.format),
    missingContent,
  };
}

/** Names of every language, for the switcher. */
export const languageNames = () => Object.fromEntries(LANGUAGES.map((c) => [c, readLang(c).name]));
