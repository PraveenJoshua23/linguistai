export type WordPos = 'NOUN' | 'VERB' | 'ADJ' | 'ADV' | 'PRON' | 'PREP' | 'CONJ' | 'DET' | 'INTJ';

export interface BreakdownWord {
  word: string;
  pos: WordPos;
  meaning: string;
  explanation: string;
  examples: string[];
}

export interface TranslationResult {
  translation: string;
  transliteration: string | null;
  /** History row id; sent back with the breakdown request so it gets saved. */
  id?: string;
  /** Set when the source language was auto-detected. */
  detectedLang?: string | null;
  /** Saved word breakdown, once it has been fetched. */
  breakdown?: BreakdownWord[];
}

export interface BreakdownResult {
  breakdown: BreakdownWord[];
}

// Subtitle sentence translation includes its breakdown inline (the transcript
// endpoint returns it in one call, unlike the on-demand main translator).
export interface SentenceTranslation extends TranslationResult {
  breakdown: BreakdownWord[];
}

export interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  context?: string;
  tone?: string;
}
