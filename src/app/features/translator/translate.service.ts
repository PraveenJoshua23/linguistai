import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY } from 'rxjs';
import { TranslateRequest, TranslationResult, BreakdownResult, BreakdownWord } from '../../shared/models/translation.model';
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

  // Word-by-word breakdown is loaded on demand (see loadBreakdown()).
  readonly breakdown = signal<BreakdownWord[]>([]);
  readonly breakdownLoading = signal(false);
  readonly breakdownLoaded = signal(false);
  readonly breakdownError = signal<string | null>(null);

  readonly translation = computed(() => this.result()?.translation ?? '');
  readonly transliteration = computed(() => this.result()?.transliteration ?? null);
  readonly accuracy = computed(() => this.result()?.accuracy ?? null);

  /**
   * Show a translation and clear any breakdown from the previous one. Older
   * history rows still carry an inline breakdown, so reuse it when present.
   */
  setResult(res: (TranslationResult & { breakdown?: BreakdownWord[] }) | null): void {
    this.result.set(res);
    const saved = res?.breakdown ?? [];
    this.breakdown.set(saved);
    this.breakdownLoaded.set(saved.length > 0);
    this.breakdownLoading.set(false);
    this.breakdownError.set(null);
  }

  swapLanguages(): void {
    const tmp = this.sourceLang();
    this.sourceLang.set(this.targetLang());
    this.targetLang.set(tmp);
    this.setResult(null);
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
        this.setResult(res);
        this.loading.set(false);
      });
  }

  /** Fetch the word-by-word breakdown of the current translation on demand. */
  loadBreakdown(): void {
    const translation = this.translation();
    if (!translation || this.breakdownLoading() || this.breakdownLoaded()) return;

    this.breakdownLoading.set(true);
    this.breakdownError.set(null);

    this.http.post<BreakdownResult>(`${environment.apiBase}/translate/breakdown`, {
      text: translation,
      language: this.targetLang(),
    })
      .pipe(
        catchError((err) => {
          this.breakdownError.set(err.error?.error ?? 'Could not load breakdown. Please try again.');
          this.breakdownLoading.set(false);
          return EMPTY;
        }),
      )
      .subscribe((res) => {
        if (this.translation() !== translation) return; // result changed while loading
        this.breakdown.set(res.breakdown ?? []);
        this.breakdownLoaded.set(true);
        this.breakdownLoading.set(false);
      });
  }
}
