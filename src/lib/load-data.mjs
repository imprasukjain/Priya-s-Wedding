// Reads the canonical data files and validates them against their schemas.
// This is the only module that sees the raw event data; everything public
// goes through toPublicData() in public-data.mjs.
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = new URL('../../', import.meta.url);

async function readJson(relPath) {
  return JSON.parse(await readFile(new URL(relPath, root), 'utf8'));
}

function validator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv;
}

function assertValid(ajv, schema, data, label) {
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    const details = validate.errors
      .map((e) => `  ${e.instancePath || '(root)'} ${e.message}`)
      .join('\n');
    throw new Error(`${label} failed schema validation:\n${details}`);
  }
}

export async function loadValidatedData() {
  const [eventData, eventSchema, updates, updatesSchema, announcements, announcementsSchema] = await Promise.all([
    readJson('event-data.json'),
    readJson('event-data-schema.json'),
    readJson('content/updates.json'),
    readJson('content/updates.schema.json'),
    readJson('content/announcements.json'),
    readJson('content/announcements.schema.json'),
  ]);
  const ajv = validator();
  assertValid(ajv, eventSchema, eventData, 'event-data.json');
  assertValid(ajv, updatesSchema, updates, 'content/updates.json');
  assertValid(ajv, announcementsSchema, announcements, 'content/announcements.json');
  const unknown = Object.keys(announcements.items).filter((id) => !eventData.schedule.some((i) => i.id === id));
  if (unknown.length) throw new Error(`content/announcements.json refers to unknown schedule ids: ${unknown.join(', ')}`);
  return { eventData, updates, announcements };
}
