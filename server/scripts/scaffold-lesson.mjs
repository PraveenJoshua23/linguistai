/**
 * Draft a new grammar lesson as a markdown file you then edit by hand.
 *
 *   node scripts/scaffold-lesson.mjs <lang> <id> "<Title>" "<teaching focus>"
 *   e.g. node scripts/scaffold-lesson.mjs korean future-tense "Future Tense -(으)ㄹ 거예요" "expressing future intention"
 *
 * Writes content/grammar/<lang>/NN-<id>.md (next number in sequence) with the
 * model's draft. ALWAYS review it — the model is unreliable on Korean particle
 * rules (받침) — then run `npm run build:grammar`. Needs GROQ_API_KEY in .env.
 */
import 'dotenv/config';
import Groq from 'groq-sdk';
import matter from 'gray-matter';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const [langKey, id, title, focus = ''] = process.argv.slice(2);
if (!langKey || !id || !title) {
  console.error('Usage: node scripts/scaffold-lesson.mjs <lang> <id> "<Title>" "<focus>"');
  process.exit(1);
}

const dir = join(ROOT, 'content', 'grammar', langKey);
if (!existsSync(dir)) {
  console.error(`No content directory for "${langKey}" at ${dir}`);
  process.exit(1);
}
const meta = JSON.parse(readFileSync(join(dir, '_meta.json'), 'utf8'));

const chat = await groq.chat.completions.create({
  model: 'openai/gpt-oss-120b',
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
        '"exercises": [{"prompt": string, "promptTranslation": string, "options": [string,string,string,string], "answerIndex": number, "explanation": string}]}. ' +
        'summary: one concise sentence. explanation: 2-4 short sentences a beginner can follow. Provide exactly 3 examples and exactly 4 exercises. ' +
        'Each exercise is a fill-in-the-blank sentence with EXACTLY ONE "___" gap that REPLACES the tested word/particle; the rest of the sentence must be complete and must NOT already contain the answer.',
    },
    {
      role: 'user',
      content: `Language: ${meta.language}\nTopic: ${title}\nTeaching focus: ${focus}\nromanization must use ${meta.romanizationLabel}.`,
    },
  ],
});

const c = JSON.parse(chat.choices[0].message.content);
const order = String(readdirSync(dir).filter((f) => f.endsWith('.md')).length + 1).padStart(2, '0');
const file = matter.stringify(`${(c.explanation ?? '').trim()}\n`, {
  id,
  title,
  level: 'Beginner',
  summary: (c.summary ?? '').trim(),
  examples: c.examples ?? [],
  exercises: c.exercises ?? [],
});

const path = join(dir, `${order}-${id}.md`);
writeFileSync(path, file);
console.log(`Drafted ${path}\nReview it (especially particle answers), then run: npm run build:grammar`);
