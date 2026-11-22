import { Injectable, computed, inject } from '@angular/core';
import { PreferencesService } from '../core/preferences/preferences.service';
import { FlashcardsService } from '../features/flashcards/flashcards.service';

/** Native name + short code per language name the API stores. Unknown names fall back to the name itself. */
const NATIVE: Record<string, { native: string; code: string }> = {
  English: { native: 'English', code: 'en' },
  Spanish: { native: 'Español', code: 'es' },
  French: { native: 'Français', code: 'fr' },
  German: { native: 'Deutsch', code: 'de' },
  Italian: { native: 'Italiano', code: 'it' },
  Portuguese: { native: 'Português', code: 'pt' },
  Dutch: { native: 'Nederlands', code: 'nl' },
  Russian: { native: 'Русский', code: 'ru' },
  Chinese: { native: '中文', code: 'zh' },
  Japanese: { native: '日本語', code: 'ja' },
  Korean: { native: '한국어', code: 'ko' },
  Arabic: { native: 'العربية', code: 'ar' },
  Hindi: { native: 'हिन्दी', code: 'hi' },
  Turkish: { native: 'Türkçe', code: 'tr' },
  Polish: { native: 'Polski', code: 'pl' },
};

export interface StudyLanguage {
  name: string;
  native: string;
  code: string;
  cards: number;
  due: number;
  /** Share of cards with an SM-2 interval of 21+ days (Anki's "mature"). */
  masteredPct: number;
}

/**
 * The language the user is studying right now is their default target language.
 * The list is that language plus every language they have flashcards in.
 */
@Injectable({ providedIn: 'root' })
export class StudyLanguageService {
  private readonly prefs = inject(PreferencesService);
  private readonly cardsSvc = inject(FlashcardsService);

  readonly currentName = computed(() => this.prefs.prefs().target_lang);

  readonly languages = computed<StudyLanguage[]>(() => {
    const now = Date.now();
    const cards = this.cardsSvc.cards();
    const names = new Set([this.currentName(), ...cards.map(c => c.language)]);
    names.delete(this.prefs.prefs().source_lang);
    return [...names].sort().map(name => {
      const mine = cards.filter(c => c.language === name);
      return {
        name,
        ...describe(name),
        cards: mine.length,
        due: mine.filter(c => new Date(c.dueAt).getTime() <= now).length,
        masteredPct: mine.length ? Math.round(100 * mine.filter(c => c.intervalDays >= 21).length / mine.length) : 0,
      };
    });
  });

  readonly current = computed(() =>
    this.languages().find(l => l.name === this.currentName()) ?? { name: this.currentName(), ...describe(this.currentName()), cards: 0, due: 0, masteredPct: 0 });

  readonly totalDue = computed(() => this.cardsSvc.dueCards().length);

  select(name: string): void {
    this.prefs.save({ target_lang: name });
  }
}

export function describe(name: string): { native: string; code: string } {
  return NATIVE[name] ?? { native: name, code: name.slice(0, 2).toLowerCase() };
}
