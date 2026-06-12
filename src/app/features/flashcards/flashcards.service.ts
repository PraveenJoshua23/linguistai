import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BreakdownWord } from '../../shared/models/translation.model';
import { SupabaseService } from '../../core/auth/supabase.service';
import { environment } from '../../../environments/environment';

export type Grade = 'still-learning' | 'getting-there' | 'mastered';

export interface Flashcard {
  id: string;
  word: string;
  language: string;
  meaning: string;
  explanation: string;
  examples: string[];
  pos: string;
  category: string;
  // SM-2 spaced-repetition state
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string; // ISO timestamp
  lastReviewedAt: string | null;
  // Optional custom deck assignment (one deck per card; null = unassigned).
  deckId: string | null;
}

export interface ReviewInput {
  cardId: string;
  grade: Grade;
}

export interface NewCardInput {
  word: string;
  language: string;
  meaning: string;
  explanation: string;
  examples: string[];
  pos: string;
}

@Injectable({ providedIn: 'root' })
export class FlashcardsService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);

  readonly cards = signal<Flashcard[]>([]);
  readonly loaded = signal(false);

  /** Cards whose next review is due now or in the past. */
  readonly dueCards = computed(() => {
    const now = Date.now();
    return this.cards().filter(c => new Date(c.dueAt).getTime() <= now);
  });

  constructor() {
    // Load saved words from DB once the user is authenticated
    effect(() => {
      const user = this.supabase.currentUser();
      if (user && !this.loaded()) {
        this.loadFromDb(user.id);
      }
    });
  }

  private loadFromDb(userId: string): void {
    this.http.get<any[]>(`${environment.apiBase}/saved-words/${userId}`)
      .subscribe({
        next: (rows) => {
          const cards: Flashcard[] = rows.map(r => this.toCard(r));
          this.cards.set(cards);
          this.loaded.set(true);
        },
        error: (e) => {
          console.warn('Could not load saved words:', e.message);
          this.loaded.set(true);
        },
      });
  }

  addWord(word: BreakdownWord, language: string): void {
    this.createCard({
      word: word.word,
      language,
      meaning: word.meaning,
      explanation: word.explanation,
      examples: word.examples,
      pos: word.pos,
    });
  }

  /**
   * Add a card from any source (translator breakdown, prebuilt deck, or the
   * user's own form). Returns false if the word already exists for that language.
   */
  createCard(input: NewCardInput): boolean {
    const exists = this.cards().some(c => c.word === input.word && c.language === input.language);
    if (exists) return false;

    const userId = this.supabase.currentUser()?.id;

    // Optimistically add to local state — new cards are due immediately.
    const tempCard: Flashcard = {
      id: crypto.randomUUID(),
      word: input.word,
      language: input.language,
      meaning: input.meaning,
      explanation: input.explanation,
      examples: input.examples,
      pos: input.pos,
      category: 'Other',
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: new Date().toISOString(),
      lastReviewedAt: null,
      deckId: null,
    };
    this.cards.update(cards => [...cards, tempCard]);

    if (userId) {
      this.http.post<any>(`${environment.apiBase}/saved-words`, {
        userId,
        word: input.word,
        language: input.language,
        meaning: input.meaning,
        explanation: input.explanation,
        examples: input.examples,
        pos: input.pos,
      }).subscribe({
        next: (row) => {
          // Replace temp card with the DB-assigned id + persisted SRS state
          this.cards.update(cards =>
            cards.map(c => c.id === tempCard.id ? this.toCard(row) : c)
          );
        },
        error: (e) => console.warn('Could not persist flashcard:', e.message),
      });
    }
    return true;
  }

  removeCard(id: string): void {
    this.cards.update(cards => cards.filter(c => c.id !== id));

    const userId = this.supabase.currentUser()?.id;
    if (userId) {
      this.http.delete(`${environment.apiBase}/saved-words/${id}`, {
        body: { userId },
      }).subscribe({ error: (e) => console.warn('Could not delete flashcard:', e.message) });
    }
  }

  isAdded(word: string, language: string): boolean {
    return this.cards().some(c => c.word === word && c.language === language);
  }

  /**
   * Persist a session's worth of ratings in one request and patch the
   * affected cards with the server-computed SM-2 state (new due dates etc.).
   */
  submitReviews(reviews: ReviewInput[]): void {
    if (reviews.length === 0) return;
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    this.http.post<any[]>(`${environment.apiBase}/saved-words/review-batch`, {
      userId,
      reviews,
    }).subscribe({
      next: (rows) => {
        const updated = new Map(rows.map(r => [r.id, this.toCard(r)]));
        this.cards.update(cards => cards.map(c => updated.get(c.id) ?? c));
      },
      error: (e) => console.warn('Could not save reviews:', e.message),
    });
  }

  private toCard(r: any): Flashcard {
    return {
      id: r.id,
      word: r.word,
      language: r.language,
      meaning: r.meaning ?? '',
      explanation: r.explanation ?? '',
      examples: Array.isArray(r.examples) ? r.examples : [],
      pos: r.pos ?? '',
      category: r.category ?? 'Other',
      easeFactor: r.ease_factor ?? 2.5,
      intervalDays: r.interval_days ?? 0,
      repetitions: r.repetitions ?? 0,
      dueAt: r.due_at ?? new Date().toISOString(),
      lastReviewedAt: r.last_reviewed_at ?? null,
      deckId: r.deck_id ?? null,
    };
  }

  /**
   * Assign cards to a custom deck (or pass null to un-assign). Patches local
   * state optimistically, then reconciles with the server response.
   */
  assignToDeck(cardIds: string[], deckId: string | null): void {
    if (cardIds.length === 0) return;
    const idSet = new Set(cardIds);
    this.cards.update(cards => cards.map(c => idSet.has(c.id) ? { ...c, deckId } : c));

    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    this.http.post<any[]>(`${environment.apiBase}/saved-words/assign-deck`, {
      userId, cardIds, deckId,
    }).subscribe({
      next: (rows) => {
        const updated = new Map(rows.map(r => [r.id, this.toCard(r)]));
        this.cards.update(cards => cards.map(c => updated.get(c.id) ?? c));
      },
      error: (e) => console.warn('Could not assign cards to deck:', e.message),
    });
  }

  /** Locally clear assignment for a deck that was just deleted. */
  onDeckDeleted(deckId: string): void {
    this.cards.update(cards => cards.map(c => c.deckId === deckId ? { ...c, deckId: null } : c));
  }
}
