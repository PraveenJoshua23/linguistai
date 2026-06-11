export type WordClass = 'NOUN' | 'VERB' | 'ADJ' | 'ADV' | 'PREP' | 'CONJ';

export interface WordEntry {
  word: string;
  phonetic: string;
  wordClass: WordClass;
  definition: string;
  examples: string[];
  saved?: boolean;
}
