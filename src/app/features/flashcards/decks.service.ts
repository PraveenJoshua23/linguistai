import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from '../../core/auth/supabase.service';
import { environment } from '../../../environments/environment';

export interface UserDeck {
  id: string;
  name: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DecksService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);

  readonly decks = signal<UserDeck[]>([]);
  readonly loaded = signal(false);

  constructor() {
    effect(() => {
      const user = this.supabase.currentUser();
      if (user && !this.loaded()) {
        this.loadFromDb();
      }
    });
  }

  private loadFromDb(): void {
    this.http.get<any[]>(`${environment.apiBase}/decks`).subscribe({
      next: (rows) => {
        this.decks.set(rows.map(r => this.toDeck(r)));
        this.loaded.set(true);
      },
      error: (e) => {
        console.warn('Could not load decks:', e.message);
        this.loaded.set(true);
      },
    });
  }

  /** Create a deck and return it (or null on failure) so callers can chain. */
  createDeck(name: string): Promise<UserDeck | null> {
    if (!this.supabase.currentUser()) return Promise.resolve(null);

    return new Promise((resolve) => {
      this.http.post<any>(`${environment.apiBase}/decks`, { name }).subscribe({
        next: (row) => {
          const deck = this.toDeck(row);
          this.decks.update(ds => [deck, ...ds]);
          resolve(deck);
        },
        error: (e) => {
          console.warn('Could not create deck:', e.message);
          resolve(null);
        },
      });
    });
  }

  deleteDeck(id: string): void {
    this.decks.update(ds => ds.filter(d => d.id !== id));

    if (!this.supabase.currentUser()) return;
    this.http.delete(`${environment.apiBase}/decks/${id}`)
      .subscribe({ error: (e) => console.warn('Could not delete deck:', e.message) });
  }

  private toDeck(r: any): UserDeck {
    return {
      id: r.id,
      name: r.name,
      createdAt: r.created_at ?? new Date().toISOString(),
    };
  }
}
