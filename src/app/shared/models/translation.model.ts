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
  breakdown: BreakdownWord[];
}

export interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  context?: string;
  tone?: string;
  userId?: string;
}
