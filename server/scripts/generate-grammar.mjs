/**
 * Generator for the standalone grammar lessons served from public/grammar/.
 *
 * Usage (from server/, needs GROQ_API_KEY in .env):
 *   node scripts/generate-grammar.mjs            # all languages
 *   node scripts/generate-grammar.mjs korean     # one language
 *
 * The topic list per language is curated here (ordered beginner -> advanced) in grammar-topics.mjs;
 * the model only fills each topic's explanation, examples, and MCQ exercises.
 */
import 'dotenv/config';
import Groq from 'groq-sdk';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURATED } from './grammar-curated.mjs';
import { LANGUAGES } from './grammar-topics.mjs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'openai/gpt-oss-120b';
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'grammar');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


async function generateTopic(lang, topic) {
  const chat = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.5,
    reasoning_effort: 'low',
    max_completion_tokens: 4000,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert language teacher writing a short grammar lesson. Return ONLY a valid JSON object: ' +
          '{"summary": string, "explanation": string, "examples": [{"text": string, "romanization": string, "translation": string}], ' +
          '"exercises": [{"prompt": string, "promptTranslation": string, "options": [string, string, string, string], "answerIndex": number, "explanation": string}]}. ' +
          'summary: one concise sentence. explanation: 2-4 short sentences a beginner can follow, plain text (no markdown). ' +
          'Provide exactly 3 examples and exactly 4 exercises. Each exercise is a fill-in-the-blank sentence with EXACTLY ONE "___" gap ' +
          'that REPLACES the single word or particle being tested. The rest of the sentence must be complete and natural and must NOT ' +
          'already contain the answer. Never attach the tested particle/word to a noun AND add a separate blank. ' +
          'Example — CORRECT: "저___ 학생이에요." options ["은","는","이","가"] answer "는". ' +
          'WRONG: "저는 ___ 학생이에요." (저 already carries 는, and the blank is in the wrong place). ' +
          'Give 4 plausible options of the same grammatical category, a 0-based answerIndex, and a one-sentence explanation. ' +
          'Keep all target-language text natural and correct.',
      },
      {
        role: 'user',
        content:
          `Language: ${lang.language}\n` +
          `Topic: ${topic.title}\n` +
          `Teaching focus: ${topic.focus}\n` +
          `romanization must use ${lang.romanizationLabel}. Write examples and exercise sentences in ${lang.language}.`,
      },
    ],
  });
  return JSON.parse(chat.choices[0].message.content);
}

function validTopicContent(c) {
  if (!c || typeof c.explanation !== 'string' || !Array.isArray(c.examples) || !Array.isArray(c.exercises)) return false;
  return c.exercises.every(
    (e) => e && typeof e.prompt === 'string' && Array.isArray(e.options) && e.options.length >= 2 &&
      Number.isInteger(e.answerIndex) && e.answerIndex >= 0 && e.answerIndex < e.options.length,
  );
}

async function buildLanguage(key) {
  const lang = LANGUAGES[key];
  const topics = [];

  for (const topic of lang.topics) {
    // Deterministic / high-error topics are hand-authored — skip the model.
    const curated = CURATED[key]?.[topic.id];
    if (curated) {
      topics.push({ id: topic.id, title: topic.title, level: topic.level, video: topic.video, ...curated });
      console.log(`  [${key}] ${topics.length}/${lang.topics.length} ${topic.title} (curated)`);
      continue;
    }

    let content = null;
    for (let attempt = 0; attempt < 4 && !content; attempt++) {
      try {
        const c = await generateTopic(lang, topic);
        if (validTopicContent(c)) content = c;
        else console.warn(`  [${key}/${topic.id}] invalid content (attempt ${attempt + 1})`);
      } catch (err) {
        console.warn(`  [${key}/${topic.id}] failed (attempt ${attempt + 1}): ${err.message.slice(0, 120)}`);
        await sleep(20_000);
      }
    }
    if (!content) {
      console.warn(`  [${key}/${topic.id}] SKIPPED after retries`);
      continue;
    }

    topics.push({
      id: topic.id,
      title: topic.title,
      level: topic.level,
      video: topic.video,
      summary: typeof content.summary === 'string' ? content.summary.trim() : '',
      explanation: content.explanation.trim(),
      examples: content.examples
        .filter((e) => e && typeof e.text === 'string')
        .map((e) => ({
          text: e.text.trim(),
          romanization: typeof e.romanization === 'string' ? e.romanization.trim() : '',
          translation: typeof e.translation === 'string' ? e.translation.trim() : '',
        })),
      exercises: content.exercises.map((e) => ({
        prompt: e.prompt.trim(),
        promptTranslation: typeof e.promptTranslation === 'string' ? e.promptTranslation.trim() : '',
        options: e.options.map((o) => String(o).trim()),
        answerIndex: e.answerIndex,
        explanation: typeof e.explanation === 'string' ? e.explanation.trim() : '',
      })),
    });
    console.log(`  [${key}] ${topics.length}/${lang.topics.length} ${topic.title}`);
    await sleep(8_000); // pace under the per-minute token limit
  }

  return { language: lang.language, name: lang.name, topics };
}

async function main() {
  const only = process.argv[2]?.toLowerCase();
  const keys = only ? [only] : Object.keys(LANGUAGES);
  if (only && !LANGUAGES[only]) {
    console.error(`Unknown language "${only}". Options: ${Object.keys(LANGUAGES).join(', ')}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  for (const key of keys) {
    console.log(`Building ${LANGUAGES[key].name}…`);
    const deck = await buildLanguage(key);
    writeFileSync(join(OUT_DIR, `${key}.json`), JSON.stringify(deck, null, 1));
    console.log(`  wrote ${deck.topics.length} topics to public/grammar/${key}.json`);
  }

  // Manifest covering every known language file that exists on disk.
  const manifest = Object.entries(LANGUAGES).map(([key, lang]) => {
    try {
      const data = JSON.parse(readFileSync(join(OUT_DIR, `${key}.json`), 'utf8'));
      return { id: key, language: lang.language, name: lang.name, file: `${key}.json`, topicCount: data.topics.length };
    } catch {
      return null;
    }
  }).filter(Boolean);

  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest with ${manifest.length} language(s).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
