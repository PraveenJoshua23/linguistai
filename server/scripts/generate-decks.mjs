/**
 * One-time generator for the prebuilt flashcard decks served from public/decks/.
 *
 * Usage (from the server/ directory, needs GROQ_API_KEY in .env):
 *   node scripts/generate-decks.mjs            # generate all decks
 *   node scripts/generate-decks.mjs korean     # regenerate a single deck
 *
 * Each deck is 500 words spread across the same categories the app already
 * uses for saved words (see src/routes/savedWords.js).
 */
import 'dotenv/config';
import Groq from 'groq-sdk';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'openai/gpt-oss-120b';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'decks');

// Per-category word counts — sums to 500.
const CATEGORY_TARGETS = {
  'Food & Drink': 63,
  'Travel': 63,
  'Body & Health': 62,
  'Business': 62,
  'Emotions': 62,
  'Nature': 62,
  'Time': 62,
  'Greetings & Social': 64,
};

const POS_SET = new Set(['NOUN', 'VERB', 'ADJ', 'ADV', 'PRON', 'PREP', 'CONJ', 'DET', 'INTJ']);

const DECKS = [
  {
    id: 'korean',
    language: 'Korean',
    name: 'Korean Essentials',
    description: '500 essential Korean words for everyday life',
    scriptNote: 'Write words in Hangul. Include Revised Romanization in "romanization". The example sentence must be in Korean with an English translation in "example_en".',
  },
  {
    id: 'japanese',
    language: 'Japanese',
    name: 'Japanese Essentials',
    description: '500 essential Japanese words for everyday life',
    scriptNote: 'Write words in standard Japanese script (kanji with common usage, or kana where natural). Include romaji in "romanization". The example sentence must be in Japanese with an English translation in "example_en".',
  },
  {
    id: 'english',
    language: 'English',
    name: 'English Essentials',
    description: '500 essential English words for everyday life',
    scriptNote: 'Target intermediate (B1–B2) English learners. "meaning" is a simple learner-dictionary definition. Set "romanization" to null. The example sentence is in English; set "example_en" to null.',
  },
];

function normalize(word) {
  return word.normalize('NFC').toLowerCase().trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestBatch(deck, category, count, avoid) {
  const avoidNote = avoid.length > 0
    ? `\nDo NOT include any of these words: ${avoid.join(', ')}`
    : '';

  const chat = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.7,
    // Free-tier Groq orgs have an 8k tokens-per-minute limit that counts
    // max_completion_tokens up front, so keep batches small. gpt-oss spends
    // completion tokens on reasoning too — keep that low or JSON gets truncated.
    reasoning_effort: 'low',
    max_completion_tokens: 5000,
    messages: [
      {
        role: 'system',
        content:
          'You are a vocabulary curator for a language-learning app. Return ONLY a valid JSON object of the form ' +
          '{"words": [{"word": string, "romanization": string|null, "meaning": string, "pos": string, "note": string, "example": string, "example_en": string|null}]}. ' +
          'pos must be one of: NOUN, VERB, ADJ, ADV, PRON, PREP, CONJ, DET, INTJ. ' +
          '"meaning" is a concise English meaning. "note" is a short usage or nuance tip (max 12 words). ' +
          '"example" is one short, natural example sentence using the word.',
      },
      {
        role: 'user',
        content:
          `Language: ${deck.language}\n` +
          `Category: ${category}\n` +
          `Give exactly ${count} of the most common, genuinely useful ${deck.language} words in this category. ` +
          `Single words or very short fixed expressions only. No duplicates.\n` +
          `${deck.scriptNote}${avoidNote}`,
      },
    ],
  });

  const parsed = JSON.parse(chat.choices[0].message.content);
  return Array.isArray(parsed.words) ? parsed.words : [];
}

async function buildDeck(deck) {
  const cards = [];
  const seen = new Set();

  for (const [category, target] of Object.entries(CATEGORY_TARGETS)) {
    const categoryWords = [];

    for (let attempt = 0; attempt < 16 && categoryWords.length < target; attempt++) {
      const need = target - categoryWords.length;
      // Tell the model what we already have so top-up batches don't repeat it.
      const avoid = categoryWords.map((c) => c.word).slice(-80);
      let batch;
      try {
        batch = await requestBatch(deck, category, Math.min(need + 3, 18), avoid);
      } catch (err) {
        console.warn(`  [${deck.id}/${category}] batch failed (attempt ${attempt + 1}): ${err.message.slice(0, 160)}`);
        await sleep(25_000); // back off — almost always a rate limit
        continue;
      }

      for (const item of batch) {
        if (categoryWords.length >= target) break;
        if (!item || typeof item.word !== 'string' || typeof item.meaning !== 'string') continue;
        const word = item.word.normalize('NFC').trim();
        const key = normalize(word);
        if (!word || seen.has(key)) continue;
        const pos = String(item.pos ?? '').toUpperCase().trim();
        if (!POS_SET.has(pos)) continue;

        seen.add(key);
        const example = typeof item.example === 'string' && item.example.trim()
          ? (item.example_en && typeof item.example_en === 'string'
            ? `${item.example.trim()} — ${item.example_en.trim()}`
            : item.example.trim())
          : null;

        categoryWords.push({
          word,
          romanization: typeof item.romanization === 'string' && item.romanization.trim() ? item.romanization.trim() : null,
          meaning: item.meaning.trim(),
          pos,
          category,
          note: typeof item.note === 'string' ? item.note.trim() : '',
          examples: example ? [example] : [],
        });
      }
      console.log(`  [${deck.id}/${category}] ${categoryWords.length}/${target}`);
      await sleep(10_000); // pace requests to stay under the per-minute token limit
    }

    if (categoryWords.length < target) {
      console.warn(`  [${deck.id}/${category}] only got ${categoryWords.length}/${target} after retries`);
    }
    cards.push(...categoryWords);
  }

  return cards;
}

async function main() {
  const only = process.argv[2]?.toLowerCase();
  const decks = only ? DECKS.filter((d) => d.id === only) : DECKS;
  if (decks.length === 0) {
    console.error(`Unknown deck "${only}". Options: ${DECKS.map((d) => d.id).join(', ')}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  for (const deck of decks) {
    console.log(`Building ${deck.name}…`);
    const cards = await buildDeck(deck);
    writeFileSync(
      join(OUT_DIR, `${deck.id}.json`),
      JSON.stringify({ id: deck.id, language: deck.language, name: deck.name, description: deck.description, cards }, null, 1),
    );
    console.log(`  wrote ${cards.length} cards to public/decks/${deck.id}.json`);
  }

  // Manifest the frontend loads up front (deck files load on demand).
  const manifest = DECKS.map((d) => {
    try {
      const data = JSON.parse(readFileSync(join(OUT_DIR, `${d.id}.json`), 'utf8'));
      return {
        id: d.id,
        language: d.language,
        name: d.name,
        description: d.description,
        file: `${d.id}.json`,
        count: data.cards.length,
        categories: [...new Set(data.cards.map((c) => c.category))],
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest with ${manifest.length} deck(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
