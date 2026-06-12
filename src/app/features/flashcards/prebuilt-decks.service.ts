import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Flashcard } from './flashcards.service';

export interface DeckInfo {
  id: string;
  language: string;
  name: string;
  description: string;
  file: string;
  count: number;
  categories: string[];
}

interface DeckFileCard {
  word: string;
  romanization: string | null;
  meaning: string;
  pos: string;
  category: string;
  note: string;
  examples: string[];
}

interface DeckFile {
  id: string;
  language: string;
  name: string;
  description: string;
  cards: DeckFileCard[];
}

@Injectable({ providedIn: 'root' })
export class PrebuiltDecksService {
  private readonly http = inject(HttpClient);

  /** Deck manifest — loaded once on first flashcards visit. */
  readonly decks = signal<DeckInfo[]>([]);
  /** Full card lists, keyed by deck id, loaded on demand. */
  readonly deckCards = signal<Record<string, Flashcard[]>>({});
  readonly loadingDeck = signal<string | null>(null);

  private manifestRequested = false;

  loadManifest(): void {
    if (this.manifestRequested) return;
    this.manifestRequested = true;
    this.http.get<DeckInfo[]>('/decks/index.json').subscribe({
      next: (decks) => this.decks.set(decks),
      error: (e) => console.warn('Could not load prebuilt decks manifest:', e.message),
    });
  }

  /** Fetch a deck's cards if not already cached. */
  ensureDeckLoaded(deckId: string): void {
    if (this.deckCards()[deckId] || this.loadingDeck() === deckId) return;
    const info = this.decks().find(d => d.id === deckId);
    if (!info) return;

    this.loadingDeck.set(deckId);
    this.http.get<DeckFile>(`/decks/${info.file}`).subscribe({
      next: (deck) => {
        const cards = deck.cards.map(c => this.toFlashcard(deck, c));
        this.deckCards.update(map => ({ ...map, [deck.id]: cards }));
        this.loadingDeck.set(null);
      },
      error: (e) => {
        console.warn(`Could not load deck "${deckId}":`, e.message);
        this.loadingDeck.set(null);
      },
    });
  }

  /**
   * Shape prebuilt entries like regular flashcards so the study session UI
   * can run them unchanged. They never enter SRS scheduling (practice only).
   */
  private toFlashcard(deck: DeckFile, c: DeckFileCard): Flashcard {
    const explanation = [
      c.romanization ? `Romanization: ${c.romanization}.` : '',
      c.note ?? '',
    ].filter(Boolean).join(' ');

    return {
      id: `prebuilt:${deck.id}:${c.word}`,
      word: c.word,
      language: deck.language,
      meaning: c.meaning,
      explanation,
      examples: c.examples ?? [],
      pos: c.pos,
      category: c.category,
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: new Date().toISOString(),
      lastReviewedAt: null,
    };
  }
}
