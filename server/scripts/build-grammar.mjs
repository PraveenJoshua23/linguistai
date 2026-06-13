/**
 * Compile the grammar content tree into the JSON the app serves.
 *
 *   npm run build:grammar          (from server/)
 *   node scripts/build-grammar.mjs
 *
 * Source:  content/grammar/<lang>/_meta.json + NN-<id>.md  (frontmatter + body)
 * Output:  public/grammar/<lang>.json + index.json
 *
 * Each lesson's frontmatter holds the metadata, examples, and exercises; the
 * markdown body is the explanation (rendered to HTML at build time). The build
 * fails loudly on malformed content so bad lessons never ship.
 */
import matter from 'gray-matter';
import { marked } from 'marked';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONTENT = join(ROOT, 'content', 'grammar');
const OUT_DIR = join(ROOT, 'public', 'grammar');

marked.setOptions({ mangle: false, headerIds: false });

const errors = [];

function compileLesson(langKey, filename, raw) {
  const where = `${langKey}/${filename}`;
  const { data, content } = matter(raw);
  const fail = (msg) => errors.push(`${where}: ${msg}`);

  for (const field of ['id', 'title', 'level', 'summary']) {
    if (!data[field] || typeof data[field] !== 'string') fail(`missing or invalid "${field}"`);
  }
  if (!content.trim()) fail('empty explanation body');

  const examples = Array.isArray(data.examples) ? data.examples : (fail('"examples" must be an array'), []);
  const exercises = Array.isArray(data.exercises) ? data.exercises : (fail('"exercises" must be an array'), []);

  exercises.forEach((e, i) => {
    const at = `exercise ${i + 1}`;
    if (!e || typeof e.prompt !== 'string') return fail(`${at}: missing prompt`);
    if ((e.prompt.match(/___/g) || []).length !== 1) fail(`${at}: prompt needs exactly one "___"`);
    if (!Array.isArray(e.options) || e.options.length < 2) fail(`${at}: needs >= 2 options`);
    if (!Number.isInteger(e.answerIndex) || e.answerIndex < 0 || e.answerIndex >= (e.options?.length ?? 0)) {
      fail(`${at}: answerIndex ${e.answerIndex} out of range`);
    }
  });

  return {
    id: data.id,
    title: data.title,
    level: data.level,
    summary: data.summary.trim(),
    explanation: marked.parse(content.trim()).trim(),
    examples: examples.map((x) => ({
      text: x.text ?? '',
      romanization: x.romanization ?? '',
      translation: x.translation ?? '',
    })),
    exercises: exercises.map((e) => ({
      prompt: e.prompt,
      promptTranslation: e.promptTranslation ?? '',
      options: (e.options ?? []).map(String),
      answerIndex: e.answerIndex,
      explanation: e.explanation ?? '',
    })),
  };
}

function buildLanguage(langKey) {
  const dir = join(CONTENT, langKey);
  const meta = JSON.parse(readFileSync(join(dir, '_meta.json'), 'utf8'));
  const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();

  const topics = [];
  const seen = new Set();
  for (const filename of files) {
    const topic = compileLesson(langKey, filename, readFileSync(join(dir, filename), 'utf8'));
    if (seen.has(topic.id)) errors.push(`${langKey}: duplicate topic id "${topic.id}"`);
    seen.add(topic.id);
    topics.push(topic);
  }

  return { meta, deck: { id: langKey, language: meta.language, name: meta.name, topics } };
}

function main() {
  if (!existsSync(CONTENT)) {
    console.error(`No content directory at ${CONTENT}`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const langKeys = readdirSync(CONTENT, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name);

  // Compile every language, then order by the `order` field in _meta.json
  // (falling back to name) so authors control the language tab order.
  const built = langKeys.map((langKey) => ({ langKey, ...buildLanguage(langKey) }));
  built.sort((a, b) =>
    (a.meta.order ?? 999) - (b.meta.order ?? 999) || a.meta.language.localeCompare(b.meta.language));

  const manifest = [];
  for (const { langKey, meta, deck } of built) {
    writeFileSync(join(OUT_DIR, `${langKey}.json`), JSON.stringify(deck, null, 1));
    manifest.push({
      id: langKey,
      language: meta.language,
      name: meta.name,
      file: `${langKey}.json`,
      topicCount: deck.topics.length,
      flag: meta.flag ?? '',
    });
    console.log(`${langKey}: ${deck.topics.length} topics`);
  }

  if (errors.length) {
    console.error(`\nBuild failed with ${errors.length} error(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest with ${manifest.length} language(s).`);
}

main();
