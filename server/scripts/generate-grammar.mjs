/**
 * Generator for the standalone grammar lessons served from public/grammar/.
 *
 * Usage (from server/, needs GROQ_API_KEY in .env):
 *   node scripts/generate-grammar.mjs            # all languages
 *   node scripts/generate-grammar.mjs korean     # one language
 *
 * The topic list per language is curated here (ordered beginner -> intermediate);
 * the model only fills each topic's explanation, examples, and MCQ exercises.
 */
import 'dotenv/config';
import Groq from 'groq-sdk';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURATED } from './grammar-curated.mjs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'openai/gpt-oss-120b';
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'grammar');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LANGUAGES = {
  korean: {
    language: 'Korean',
    name: 'Korean Grammar',
    romanizationLabel: 'Revised Romanization',
    topics: [
      { id: 'topic-particle', title: 'Topic Particle 은/는', level: 'Beginner', focus: 'Marking the topic of a sentence; 은 after a consonant, 는 after a vowel; contrast vs new information.' },
      { id: 'subject-particle', title: 'Subject Particle 이/가', level: 'Beginner', focus: 'Marking the grammatical subject; 이 after a consonant, 가 after a vowel; 은/는 vs 이/가.' },
      { id: 'object-particle', title: 'Object Particle 을/를', level: 'Beginner', focus: 'Marking the direct object; 을 after a consonant, 를 after a vowel.' },
      { id: 'copula-ida', title: 'The Copula 이다 (to be)', level: 'Beginner', focus: 'Saying "A is B" with 이에요/예요 in polite speech.' },
      { id: 'present-tense', title: 'Present Tense -아요/어요', level: 'Beginner', focus: 'Polite present tense verb conjugation and vowel harmony (-아요 vs -어요 vs -해요).' },
      { id: 'past-tense', title: 'Past Tense -았/었어요', level: 'Beginner', focus: 'Polite past tense conjugation with -았어요/-었어요/-했어요.' },
      { id: 'negation', title: 'Negation 안 and -지 않다', level: 'Beginner', focus: 'Short negation 안 before the verb vs long negation -지 않다.' },
      { id: 'existence', title: 'Existence 있다 / 없다', level: 'Beginner', focus: 'Expressing there is/has (있어요) and there is not/has not (없어요).' },
      { id: 'location-particles', title: 'Location Particles 에 / 에서', level: 'Beginner', focus: '에 for destination/static location, 에서 for the place an action happens.' },
      { id: 'want-to', title: 'Want to -고 싶다', level: 'Intermediate', focus: 'Expressing desire with the -고 싶다 construction.' },
      { id: 'connective-go', title: 'Connective -고 (and / then)', level: 'Intermediate', focus: 'Linking clauses/actions in sequence with -고.' },
      { id: 'honorifics', title: 'Honorifics -(으)시-', level: 'Intermediate', focus: 'Subject honorific -(으)시- to show respect to the person being talked about.' },
    ],
  },
  japanese: {
    language: 'Japanese',
    name: 'Japanese Grammar',
    romanizationLabel: 'Romaji',
    topics: [
      { id: 'topic-particle-wa', title: 'Topic Particle は', level: 'Beginner', focus: 'Marking the topic; written は but read "wa"; A は B です.' },
      { id: 'subject-particle-ga', title: 'Subject Particle が', level: 'Beginner', focus: 'Marking the subject; は vs が (topic vs new/identifying information).' },
      { id: 'object-particle-wo', title: 'Object Particle を', level: 'Beginner', focus: 'Marking the direct object; read "o".' },
      { id: 'copula-desu', title: 'The Copula です', level: 'Beginner', focus: 'Polite "to be" with です and the negative じゃありません.' },
      { id: 'masu-form', title: 'Polite Verbs -ます', level: 'Beginner', focus: 'The polite -ます form and its negative -ません.' },
      { id: 'past-tense', title: 'Past Tense -ました / でした', level: 'Beginner', focus: 'Polite past -ました/-ませんでした and でした for nouns/adjectives.' },
      { id: 'existence', title: 'Existence あります / います', level: 'Beginner', focus: 'あります for inanimate things, います for living things.' },
      { id: 'particles-ni-de', title: 'Particles に and で', level: 'Beginner', focus: 'に for destination/time/static location, で for where an action occurs and means.' },
      { id: 'possessive-no', title: 'Possessive の', level: 'Beginner', focus: 'Linking nouns and showing possession with の (A の B).' },
      { id: 'te-form', title: 'The て-form', level: 'Intermediate', focus: 'Forming and using the て-form to connect actions and make requests (-てください).' },
      { id: 'want-to-tai', title: 'Want to -たい', level: 'Intermediate', focus: 'Expressing desire to do something with the -たい form.' },
      { id: 'adjectives', title: 'い and な Adjectives', level: 'Intermediate', focus: 'The two adjective classes and how they attach to nouns and conjugate.' },
    ],
  },
};

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
      topics.push({ id: topic.id, title: topic.title, level: topic.level, ...curated });
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
