import { Router } from 'express';
import Groq from 'groq-sdk';
import sql from '../db.js';
import { validateTranslateRequest } from '../middleware/validate.js';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a precise translation engine. Return ONLY a valid JSON object with no markdown, no code fences, no extra text. The JSON must match this exact shape:
{
  "translation": string,
  "transliteration": string | null,
  "accuracy": "high" | "medium" | "low",
  "breakdown": [
    {
      "word": string,
      "pos": string,
      "meaning": string,
      "explanation": string,
      "examples": string[]
    }
  ]
}
transliteration: the romanised pronunciation of the "translation" value ONLY — directly transliterate the translated output character by character into Latin script (e.g. for Arabic, Chinese, Japanese, Korean, Hindi, Russian, etc.). Do NOT transliterate the source text. Set to null if the target language already uses the Latin alphabet.
Each item in breakdown is one word from the translated output. pos values: NOUN, VERB, ADJ, ADV, PRON, PREP, CONJ, DET, INTJ.`;

router.post('/', validateTranslateRequest, async (req, res) => {
  const {
    text,
    sourceLang,
    targetLang,
    context = 'General',
    tone = 'Neutral',
    userId = null,
  } = req.body;

  try {
    const chat = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Translate the following text from ${sourceLang} to ${targetLang}.
Context: ${context}
Tone: ${tone}
Text: "${text}"`,
        },
      ],
    });

    const result = JSON.parse(chat.choices[0].message.content);

    if (userId) {
      await sql`
        insert into translations (user_id, source_text, source_lang, target_lang, result_json)
        values (${userId}, ${text}, ${sourceLang}, ${targetLang}, ${sql.json(result)})
      `;
    }

    res.json(result);
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('Groq returned non-JSON:', err.message);
      return res.status(502).json({ error: 'Translation service returned an unexpected format' });
    }
    console.error('Translation error:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
