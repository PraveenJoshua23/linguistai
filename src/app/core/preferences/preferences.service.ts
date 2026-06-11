import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from '../auth/supabase.service';
import { environment } from '../../../environments/environment';

export interface UserPreferences {
  source_lang: string;
  target_lang: string;
  default_context: string;
  default_tone: 'Formal' | 'Informal';
  sidebar_collapsed: boolean;
  show_breakdown: boolean;
  show_transliteration: boolean;
  flashcard_shuffle: boolean;
  flashcard_auto_advance: boolean;
  display_name: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  source_lang: 'English',
  target_lang: 'Spanish',
  default_context: 'General',
  default_tone: 'Formal',
  sidebar_collapsed: false,
  show_breakdown: true,
  show_transliteration: true,
  flashcard_shuffle: false,
  flashcard_auto_advance: true,
  display_name: '',
};

const LS_KEY = 'linguistai_prefs';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);

  readonly prefs = signal<UserPreferences>({ ...DEFAULT_PREFERENCES });
  readonly loaded = signal(false);
  readonly saving = signal(false);

  constructor() {
    // Hydrate from localStorage immediately so UI doesn't flash defaults
    const cached = localStorage.getItem(LS_KEY);
    if (cached) {
      try { this.prefs.set({ ...DEFAULT_PREFERENCES, ...JSON.parse(cached) }); } catch {}
    }

    // Once auth resolves, load from DB
    effect(() => {
      const user = this.supabase.currentUser();
      if (user && !this.loaded()) {
        this.load(user.id);
      }
    });
  }

  private load(userId: string): void {
    this.http.get<UserPreferences>(`${environment.apiBase}/preferences/${userId}`)
      .subscribe({
        next: (prefs) => {
          const merged = { ...DEFAULT_PREFERENCES, ...prefs };
          this.prefs.set(merged);
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
          this.loaded.set(true);
        },
        error: () => this.loaded.set(true),
      });
  }

  save(updates: Partial<UserPreferences>): void {
    const updated = { ...this.prefs(), ...updates };
    this.prefs.set(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));

    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    this.saving.set(true);
    this.http.put(`${environment.apiBase}/preferences/${userId}`, updated)
      .subscribe({
        next: () => this.saving.set(false),
        error: () => this.saving.set(false),
      });
  }
}
