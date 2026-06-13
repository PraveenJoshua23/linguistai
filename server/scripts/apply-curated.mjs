/**
 * Splice the hand-authored CURATED topics into the existing public/grammar
 * JSON files, replacing whatever the model produced for those topic ids while
 * leaving the verified non-curated topics untouched. Lets us fix the
 * particle topics without re-running (and re-reviewing) the whole generator.
 *
 *   node scripts/apply-curated.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURATED } from './grammar-curated.mjs';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'grammar');

for (const [key, topicsMap] of Object.entries(CURATED)) {
  const path = join(OUT_DIR, `${key}.json`);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  let replaced = 0;
  data.topics = data.topics.map((t) => {
    if (topicsMap[t.id]) {
      replaced++;
      return { id: t.id, title: t.title, level: t.level, ...topicsMap[t.id] };
    }
    return t;
  });
  writeFileSync(path, JSON.stringify(data, null, 1));
  console.log(`${key}: applied ${replaced} curated topics`);
}
