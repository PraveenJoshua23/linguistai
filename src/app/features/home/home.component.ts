import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { SupabaseService } from '../../core/auth/supabase.service';
import { FlashcardsService } from '../flashcards/flashcards.service';
import { GrammarService } from '../grammar/grammar.service';
import { TranslateService } from '../translator/translate.service';
import { StudyLanguageService } from '../../shared/study-language.service';
import { TranslationResult } from '../../shared/models/translation.model';
import { environment } from '../../../environments/environment';

interface HistoryEntry {
  id: string;
  source_text: string;
  source_lang: string;
  target_lang: string;
  result_json: TranslationResult;
  created_at: string;
}

const ICONS = {
  translate: 'm10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802',
  video: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM6 15h5M13 15h5',
  cards: 'M7 4h12a1 1 0 0 1 1 1v12M4 8h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z',
  saved: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="px-4 sm:px-8 lg:px-12 py-8">
      <div class="max-w-[1120px] mx-auto flex flex-col gap-6">

        <header class="flex flex-col gap-1">
          <span class="text-[13px] text-slate-600">{{ today | date:'EEEE, d MMMM' }}</span>
          <h1 class="text-[28px] font-bold tracking-tight text-slate-900">{{ greeting() }}{{ name() ? ', ' + name() : '' }}</h1>
          <p class="text-slate-600">
            You're studying <strong class="text-slate-900">{{ cur().name }}</strong>
            <span [attr.lang]="cur().code"> ({{ cur().native }})</span> from {{ prefs.prefs().source_lang }}.
          </p>
        </header>

        <!-- Review hero + today -->
        <section class="grid gap-4 lg:grid-cols-3">
          <div class="lg:col-span-2 bg-slate-900 text-white rounded-[18px] p-7 flex flex-wrap items-center justify-between gap-5">
            @if (cur().due > 0) {
              <div class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold tracking-wider uppercase text-blue-300">Today's review · {{ cur().name }}</span>
                <span class="text-[44px] font-bold tracking-tight leading-none">{{ cur().due }} card{{ cur().due === 1 ? '' : 's' }} due</span>
                <span class="text-slate-300">Spaced repetition works best when you review daily.</span>
              </div>
              <a routerLink="/flashcards"
                class="inline-flex items-center gap-2 min-h-12 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold">
                Start review
                <svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
            } @else {
              <div class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold tracking-wider uppercase text-green-300">Today's review · {{ cur().name }}</span>
                <span class="text-4xl font-bold tracking-tight">All caught up</span>
                <span class="text-slate-300">
                  {{ cur().cards ? 'Nothing due right now.' : 'No ' + cur().name + ' cards yet.' }}
                  Add new words from a translation or video.
                </span>
              </div>
              <a routerLink="/translate" class="inline-flex items-center min-h-12 px-5 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100">Find new words</a>
            }
          </div>

          <div class="bg-white border border-slate-200 rounded-[18px] p-6 flex flex-col gap-2">
            <span class="font-semibold text-slate-900">Today</span>
            <span class="text-4xl font-bold tracking-tight text-slate-900">{{ reviewedToday() }}</span>
            <span class="text-sm text-slate-600">card{{ reviewedToday() === 1 ? '' : 's' }} reviewed across all languages</span>
            @if (study.totalDue() > cur().due) {
              <span class="text-sm text-slate-600 mt-auto">{{ study.totalDue() - cur().due }} more due in other languages</span>
            }
          </div>
        </section>

        <!-- Quick actions -->
        <section aria-label="Quick actions" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          @for (a of actions(); track a.title) {
            <a [routerLink]="a.route"
              class="flex items-center gap-3 min-h-16 px-4 py-3.5 rounded-[14px] bg-white border border-slate-200 hover:border-blue-200 transition-colors">
              <span class="w-[38px] h-[38px] rounded-[10px] bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <svg aria-hidden="true" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="a.icon"/></svg>
              </span>
              <span class="flex flex-col min-w-0">
                <span class="font-semibold text-slate-900">{{ a.title }}</span>
                <span class="text-xs text-slate-600 truncate">{{ a.sub }}</span>
              </span>
            </a>
          }
        </section>

        <!-- Languages -->
        <section class="flex flex-col gap-3">
          <div class="flex items-baseline justify-between gap-3">
            <h2 class="text-[17px] font-bold text-slate-900">Your languages</h2>
            <a routerLink="/settings" class="font-semibold text-blue-600 hover:text-blue-700">+ Add a language</a>
          </div>
          <div class="grid gap-3 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
            @for (l of study.languages(); track l.name) {
              <button (click)="study.select(l.name)" [attr.aria-pressed]="l.name === cur().name"
                class="flex flex-col gap-3.5 p-[18px] rounded-2xl bg-white text-left cursor-pointer hover:border-blue-200 transition-colors"
                [class]="l.name === cur().name ? 'border-2 border-blue-600' : 'border border-slate-200'">
                <span class="flex items-center gap-2.5 w-full">
                  <span class="w-9 h-9 rounded-[9px] bg-slate-100 text-slate-700 font-bold text-xs uppercase flex items-center justify-center">{{ l.code }}</span>
                  <span class="flex-1 flex flex-col">
                    <span class="font-semibold text-slate-900">{{ l.name }}</span>
                    <span [attr.lang]="l.code" class="text-[13px] text-slate-600">{{ l.native }}</span>
                  </span>
                  <span class="text-xs font-semibold" [class]="l.due ? 'text-blue-700' : 'text-green-700'">
                    {{ l.due ? l.due + ' due' : 'Caught up' }}
                  </span>
                </span>
                <span class="flex flex-col gap-1.5 w-full">
                  <span class="flex justify-between text-xs text-slate-600">
                    <span>{{ l.cards }} card{{ l.cards === 1 ? '' : 's' }}</span><span>{{ l.masteredPct }}% mastered</span>
                  </span>
                  <span class="block h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <span class="block h-full rounded-full bg-blue-600" [style.width.%]="l.masteredPct"></span>
                  </span>
                </span>
                <span class="text-xs text-slate-600">{{ grammarCount(l.name) ? 'Grammar: ' + grammarCount(l.name) + ' topics' : 'Grammar lessons coming soon' }}</span>
              </button>
            }
          </div>
        </section>

        <!-- Grammar + recent -->
        <section class="grid gap-4 lg:grid-cols-3">
          <div class="bg-white border border-slate-200 rounded-[18px] p-6 flex flex-col gap-3.5">
            <span class="font-bold text-slate-900">Grammar</span>
            @if (grammarCount(cur().name)) {
              <span class="text-xl font-bold text-slate-900">{{ cur().name }} grammar</span>
              <span class="text-slate-600">{{ grammarCount(cur().name) }} topics with examples and exercises.</span>
              <a routerLink="/grammar"
                class="self-start inline-flex items-center min-h-11 px-[18px] rounded-[11px] border border-slate-300 text-slate-900 font-semibold hover:bg-slate-50">Open lessons</a>
            } @else {
              <div class="flex flex-col gap-2 p-[18px] rounded-xl bg-slate-50 border border-dashed border-slate-300">
                <span class="font-semibold text-slate-900">{{ cur().name }} lessons are on the way</span>
                <span class="text-slate-600">Until then, the translator's word breakdown explains grammar in context.</span>
              </div>
            }
          </div>

          <div class="lg:col-span-2 bg-white border border-slate-200 rounded-[18px] p-6 flex flex-col gap-2 min-w-0">
            <div class="flex justify-between items-baseline">
              <span class="font-bold text-slate-900">Recent in {{ cur().name }}</span>
              <a routerLink="/history" class="font-semibold text-[13px] text-blue-600 hover:text-blue-700">View history</a>
            </div>
            @for (r of recent(); track r.id) {
              <button (click)="reuse(r)"
                class="flex items-center gap-3.5 min-h-14 py-2 px-2.5 -mx-2.5 rounded-[10px] hover:bg-slate-50 text-left">
                <span class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="icons.translate"/></svg>
                </span>
                <span class="flex-1 min-w-0 flex flex-col">
                  <span [attr.lang]="cur().code" class="font-semibold text-slate-900 truncate">{{ r.result_json.translation }}</span>
                  <span class="text-xs text-slate-600 truncate">{{ r.source_text }}</span>
                </span>
                <span class="text-xs text-slate-600 shrink-0">{{ r.created_at | date:'d MMM' }}</span>
              </button>
            } @empty {
              <p class="text-sm text-slate-600 py-4">
                {{ historyLoaded() ? 'No ' + cur().name + ' translations yet.' : 'Loading…' }}
              </p>
            }
          </div>
        </section>

      </div>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly cardsSvc = inject(FlashcardsService);
  private readonly grammarSvc = inject(GrammarService);
  private readonly translateSvc = inject(TranslateService);
  protected readonly prefs = inject(PreferencesService);
  protected readonly study = inject(StudyLanguageService);

  readonly icons = ICONS;
  readonly today = new Date();
  readonly cur = this.study.current;
  private readonly history = signal<HistoryEntry[]>([]);
  readonly historyLoaded = signal(false);

  readonly name = computed(() =>
    this.prefs.prefs().display_name || (this.supabase.currentUser()?.email ?? '').split('@')[0]);

  readonly greeting = computed(() => {
    const h = this.today.getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  });

  readonly reviewedToday = computed(() => {
    const start = new Date().setHours(0, 0, 0, 0);
    return this.cardsSvc.cards().filter(c => c.lastReviewedAt && new Date(c.lastReviewedAt).getTime() >= start).length;
  });

  // ponytail: filters the latest 50 rows client-side; add a lang param to /history if older items matter.
  readonly recent = computed(() => this.history().filter(h => h.target_lang === this.cur().name).slice(0, 4));

  readonly actions = computed(() => [
    { title: 'Translate', sub: `${this.prefs.prefs().source_lang} → ${this.cur().name}`, route: '/translate', icon: ICONS.translate },
    { title: 'Learn from a video', sub: 'Paste a YouTube link', route: '/subtitles', icon: ICONS.video },
    { title: 'Flashcards', sub: `Your ${this.cur().name} cards`, route: '/flashcards', icon: ICONS.cards },
    { title: 'Saved words', sub: 'Words and phrases', route: '/saved', icon: ICONS.saved },
  ]);

  ngOnInit(): void {
    this.grammarSvc.loadManifest();
    this.http.get<HistoryEntry[]>(`${environment.apiBase}/history`, { params: { limit: '50' } }).subscribe({
      next: rows => { this.history.set(rows); this.historyLoaded.set(true); },
      error: () => this.historyLoaded.set(true),
    });
  }

  grammarCount(language: string): number {
    return this.grammarSvc.languages().find(g => g.language === language)?.topicCount ?? 0;
  }

  reuse(entry: HistoryEntry): void {
    this.translateSvc.sourceText.set(entry.source_text);
    this.translateSvc.sourceLang.set(entry.source_lang);
    this.translateSvc.targetLang.set(entry.target_lang);
    this.translateSvc.setResult(entry.result_json);
    this.router.navigate(['/translate']);
  }
}
