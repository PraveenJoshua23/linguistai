import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY } from 'rxjs';
import { TranslateRequest, TranslationResult } from '../../shared/models/translation.model';
import { SupabaseService } from '../../core/auth/supabase.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { environment } from '../../../environments/environment';

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian',
  'Portuguese', 'Dutch', 'Russian', 'Chinese', 'Japanese',
  'Korean', 'Arabic', 'Hindi', 'Turkish', 'Polish',
];

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly prefsSvc = inject(PreferencesService);

  readonly languages = LANGUAGES;

  readonly sourceLang = signal('English');
  readonly targetLang = signal('Spanish');
  readonly sourceText = signal('');
  readonly context = signal('General');
  readonly tone = signal<'Formal' | 'Informal'>('Formal');

  constructor() {
    // Apply saved preferences once loaded
    effect(() => {
      if (this.prefsSvc.loaded()) {
        const p = this.prefsSvc.prefs();
        this.sourceLang.set(p.source_lang);
        this.targetLang.set(p.target_lang);
        this.context.set(p.default_context);
        this.tone.set(p.default_tone);
      }
    });
  }

  readonly result = signal<TranslationResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly translation = computed(() => this.result()?.translation ?? '');
  readonly transliteration = computed(() => this.result()?.transliteration ?? null);
  readonly accuracy = computed(() => this.result()?.accuracy ?? null);
  readonly breakdown = computed(() => this.result()?.breakdown ?? []);

  swapLanguages(): void {
    const tmp = this.sourceLang();
    this.sourceLang.set(this.targetLang());
    this.targetLang.set(tmp);
    this.result.set(null);
  }

  translate(): void {
    const text = this.sourceText().trim();
    if (!text) return;

    this.loading.set(true);
    this.error.set(null);

    const body: TranslateRequest = {
      text,
      sourceLang: this.sourceLang(),
      targetLang: this.targetLang(),
      context: this.context(),
      tone: this.tone(),
      userId: this.supabase.currentUser()?.id,
    };

    this.http.post<TranslationResult>(`${environment.apiBase}/translate`, body)
      .pipe(
        catchError((err) => {
          this.error.set(err.error?.error ?? 'Translation failed. Please try again.');
          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe((res) => {
        this.result.set(res);
        this.loading.set(false);
      });
  }
}
