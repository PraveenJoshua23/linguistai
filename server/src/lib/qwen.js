/**
 * Qwen-MT translation client (Alibaba Cloud Model Studio / DashScope).
 *
 * Qwen-MT is a translation-only model: given text + source/target language it
 * returns the translated string via an OpenAI-compatible endpoint. It does NOT
 * do transliteration or word breakdown — those stay on Groq (see translate.js).
 *
 * Config (env):
 *   DASHSCOPE_API_KEY    required to enable Qwen-MT; if unset, translate.js
 *                        falls back to Groq for the translation.
 *   DASHSCOPE_BASE_URL   default: international (Singapore) endpoint.
 *   QWEN_MT_MODEL        default: qwen-mt-turbo.
 */
const BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const MODEL = process.env.QWEN_MT_MODEL || 'qwen-mt-turbo';

export function hasQwen() {
  return Boolean(process.env.DASHSCOPE_API_KEY);
}

/** Translate `text` from `sourceLang` to `targetLang` (full English language names). */
export async function qwenTranslate(text, sourceLang, targetLang) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: text }],
      // Qwen-MT accepts full English language names, or "auto" to detect.
      translation_options: { source_lang: sourceLang || 'auto', target_lang: targetLang },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Qwen-MT ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content;
  if (!out || typeof out !== 'string') {
    throw new Error('Qwen-MT returned no translation content');
  }
  return out.trim();
}
