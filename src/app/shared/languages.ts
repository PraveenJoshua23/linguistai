/**
 * The one language list. `name` is what the API and DB store; `code` is ISO 639-1 (YouTube captions, TTS);
 * `native` is the language's name for itself.
 */
export const LANGUAGES = [
  { name: 'English', code: 'en', native: 'English' },
  { name: 'Spanish', code: 'es', native: 'Español' },
  { name: 'French', code: 'fr', native: 'Français' },
  { name: 'German', code: 'de', native: 'Deutsch' },
  { name: 'Italian', code: 'it', native: 'Italiano' },
  { name: 'Portuguese', code: 'pt', native: 'Português' },
  { name: 'Dutch', code: 'nl', native: 'Nederlands' },
  { name: 'Russian', code: 'ru', native: 'Русский' },
  { name: 'Chinese', code: 'zh', native: '中文' },
  { name: 'Japanese', code: 'ja', native: '日本語' },
  { name: 'Korean', code: 'ko', native: '한국어' },
  { name: 'Arabic', code: 'ar', native: 'العربية' },
  { name: 'Hindi', code: 'hi', native: 'हिन्दी' },
  { name: 'Turkish', code: 'tr', native: 'Türkçe' },
  { name: 'Polish', code: 'pl', native: 'Polski' },
] as const;

export const LANGUAGE_NAMES: string[] = LANGUAGES.map(l => l.name);

/** Source-language value meaning "let the server detect it". */
export const AUTO_DETECT = 'auto';
