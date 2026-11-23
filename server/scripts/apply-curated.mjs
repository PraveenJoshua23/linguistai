/**
 * Rebuild the public/grammar JSON files from grammar-topics.mjs without
 * calling the model: hand-authored CURATED topics replace (or add) their
 * entries, verified generated topics are kept as-is, and each topic gets its
 * title/level/video from the topic list. Lets us fix or add topics without
 * re-running (and re-reviewing) the whole generator.
 *
 *   node scripts/apply-curated.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURATED } from './grammar-curated.mjs';
import { LANGUAGES } from './grammar-topics.mjs';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'grammar');
const manifest = [];

for (const [key, lang] of Object.entries(LANGUAGES)) {
  const path = join(OUT_DIR, `${key}.json`);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const existing = Object.fromEntries(data.topics.map((t) => [t.id, t]));

  data.topics = lang.topics.flatMap((t) => {
    const { id, title, level, video } = t;
    const content = CURATED[key]?.[id] ?? existing[id];
    if (!content) {
      console.warn(`  [${key}/${id}] no curated or generated content — skipped`);
      return [];
    }
    const { summary, explanation, examples, exercises } = content;
    return [{ id, title, level, video, summary, explanation, examples, exercises }];
  });

  writeFileSync(path, JSON.stringify(data, null, 1));
  manifest.push({ id: key, language: lang.language, name: lang.name, file: `${key}.json`, topicCount: data.topics.length });
  console.log(`${key}: wrote ${data.topics.length} topics`);
}

writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(manifest, null, 2));
