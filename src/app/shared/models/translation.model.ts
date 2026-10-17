export type WordPos = 'NOUN' | 'VERB' | 'ADJ' | 'ADV' | 'PRON' | 'PREP' | 'CONJ' | 'DET' | 'INTJ';
export type TranslationAccuracy = 'high' | 'medium' | 'low';

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
  accuracy: TranslationAccuracy;
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
