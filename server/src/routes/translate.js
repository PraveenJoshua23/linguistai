import { Router } from 'express';
import Groq from 'groq-sdk';
import sql from '../db.js';
import { validateTranslateRequest } from '../middleware/validate.js';
import { hasQwen, qwenTranslate } from '../lib/qwen.js';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GROQ_MODEL = 'openai/gpt-oss-120b';

// --- Translation (Qwen-MT when configured, Groq fallback otherwise) ---------

async function groqTranslate(text, sourceLang, targetLang, context, tone) {
  const chat = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a precise translation engine. Return ONLY the translated text — no quotes, no notes, no extra commentary.',
      },
      {
        role: 'user',
        content: `Translate the following text from ${sourceLang} to ${targetLang}.\nContext: ${context}\nTone: ${tone}\nText: "${text}"`,
      },
    ],
  });
  return chat.choices[0].message.content.trim();
}

// Romanise the translated output and rate accuracy. Small best-effort JSON call;
// if it fails we still return the translation (transliteration null).
const TRANSLIT_PROMPT = `You are a linguistics assistant. Return ONLY a valid JSON object: {"transliteration": string | null, "accuracy": "high" | "medium" | "low"}.
transliteration: the romanised pronunciation of the TRANSLATION text, transliterated character-by-character into Latin script (for Arabic, Chinese, Japanese, Korean, Hindi, Russian, etc.). Set to null if the translation already uses the Latin alphabet.
accuracy: your confidence that the translation is accurate and natural for the target language.`;

async function transliterateAndRate(translation, sourceText, sourceLang, targetLang) {
  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: TRANSLIT_PROMPT },
        {
          role: 'user',
          content: `Source (${sourceLang}): "${sourceText}"\nTranslation (${targetLang}): "${translation}"`,
        },
      ],
    });
    const parsed = JSON.parse(chat.choices[0].message.content);
    const accuracy = ['high', 'medium', 'low'].includes(parsed.accuracy) ? parsed.accuracy : 'medium';
    return { transliteration: parsed.transliteration ?? null, accuracy };
  } catch (err) {
    console.warn('Transliteration step failed (returning translation only):', err.message);
    return { transliteration: null, accuracy: 'medium' };
  }
}

router.post('/', validateTranslateRequest, async (req, res) => {
  const {
    text,
    sourceLang,
    targetLang,
    context = 'General',
    tone = 'Neutral',
  } = req.body;

  try {
    const viaGroq = () => groqTranslate(text, sourceLang, targetLang, context, tone);
    const translation = hasQwen()
      ? await qwenTranslate(text, sourceLang, targetLang).catch((err) => {
          console.warn('Qwen-MT failed, falling back to Groq:', err.message);
          return viaGroq();
        })
      : await viaGroq();

    const { transliteration, accuracy } = await transliterateAndRate(translation, text, sourceLang, targetLang);

    // breakdown is loaded on demand via POST /translate/breakdown; keep the key
    // present (empty) so saved history rows have a stable shape.
    const result = { translation, transliteration, accuracy, breakdown: [] };

    await sql`
      insert into translations (user_id, source_text, source_lang, target_lang, result_json)
      values (${req.userId}, ${text}, ${sourceLang}, ${targetLang}, ${sql.json(result)})
    `;

    res.json(result);
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// --- On-demand word-by-word breakdown (Groq) --------------------------------

const BREAKDOWN_PROMPT = `You are a precise language tutor. Return ONLY a valid JSON object: {"breakdown": [{"word": string, "pos": string, "meaning": string, "explanation": string, "examples": string[]}]}.
Each item is one word from the provided text, in the given language. pos values: NOUN, VERB, ADJ, ADV, PRON, PREP, CONJ, DET, INTJ.`;

router.post('/breakdown', async (req, res) => {
  const { text, language } = req.body;

  if (!text || typeof text !== 'string' || !language) {
    return res.status(400).json({ error: 'text and language are required' });
  }

  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: BREAKDOWN_PROMPT },
        { role: 'user', content: `Language: ${language}\nText: "${text}"` },
      ],
    });
    const parsed = JSON.parse(chat.choices[0].message.content);
    res.json({ breakdown: Array.isArray(parsed.breakdown) ? parsed.breakdown : [] });
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('Breakdown returned non-JSON:', err.message);
      return res.status(502).json({ error: 'Breakdown service returned an unexpected format' });
    }
    console.error('Breakdown error:', err.message);
    res.status(500).json({ error: 'Breakdown failed' });
  }
});

export default router;
