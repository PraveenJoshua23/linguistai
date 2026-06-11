import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from '../../core/auth/supabase.service';
import { environment } from '../../../environments/environment';

export interface SavedPhrase {
  id: string;
  phrase: string;
  language: string;
  translation?: string;
  transliteration?: string;
  source?: 'subtitle' | 'translator';
  videoId?: string;
  videoTitle?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PhrasesService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);

  readonly phrases = signal<SavedPhrase[]>([]);
  readonly loaded = signal(false);

  constructor() {
    effect(() => {
      const user = this.supabase.currentUser();
      if (user && !this.loaded()) this.loadFromDb(user.id);
    });
  }

  private loadFromDb(userId: string): void {
    this.http.get<any[]>(`${environment.apiBase}/saved-phrases/${userId}`)
      .subscribe({
        next: (rows) => {
          this.phrases.set(rows.map(r => ({
            id: r.id,
            phrase: r.phrase,
            language: r.language,
            translation: r.translation ?? undefined,
            transliteration: r.transliteration ?? undefined,
            source: r.source ?? undefined,
            videoId: r.video_id ?? undefined,
            videoTitle: r.video_title ?? undefined,
            createdAt: r.created_at,
          })));
          this.loaded.set(true);
        },
        error: (e) => {
          console.warn('Could not load saved phrases:', e.message);
          this.loaded.set(true);
        },
      });
  }

  savePhrase(data: Omit<SavedPhrase, 'id' | 'createdAt'>): void {
    if (this.isSaved(data.phrase, data.language)) return;

    const userId = this.supabase.currentUser()?.id;
    const temp: SavedPhrase = { ...data, id: crypto.randomUUID() };
    this.phrases.update(ps => [temp, ...ps]);

    if (userId) {
      this.http.post<any>(`${environment.apiBase}/saved-phrases`, {
        userId,
        phrase: data.phrase,
        language: data.language,
        translation: data.translation,
        transliteration: data.transliteration,
        source: data.source,
        videoId: data.videoId,
        videoTitle: data.videoTitle,
      }).subscribe({
        next: (row) => {
          this.phrases.update(ps =>
            ps.map(p => p.id === temp.id ? { ...temp, id: row.id } : p)
          );
        },
        error: (e) => console.warn('Could not persist phrase:', e.message),
      });
    }
  }

  removePhrase(id: string): void {
    this.phrases.update(ps => ps.filter(p => p.id !== id));
    const userId = this.supabase.currentUser()?.id;
    if (userId) {
      this.http.delete(`${environment.apiBase}/saved-phrases/${id}`, {
        body: { userId },
      }).subscribe({ error: (e) => console.warn('Could not delete phrase:', e.message) });
    }
  }

  isSaved(phrase: string, language: string): boolean {
    return this.phrases().some(p => p.phrase === phrase && p.language === language);
  }
}
