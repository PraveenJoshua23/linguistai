import {
  Component, inject, signal, computed, OnDestroy, ElementRef, ViewChild, AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslationResult } from '../../shared/models/translation.model';
import { FlashcardsService } from '../flashcards/flashcards.service';
import { PhrasesService } from '../glossary/phrases.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { environment } from '../../../environments/environment';

declare const YT: any;

interface Sentence {
  text: string;
  startTime: number;
  duration: number;
  originalText: string | null;
}

interface TranscriptResponse {
  videoId: string;
  title: string;
  lang: string;
  origLang: string | null;
  sentences: Sentence[];
}

interface SentenceResult {
  sentence: Sentence;
  result: TranslationResult;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
];

@Component({
  selector: 'app-subtitles',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    :host { display: flex; flex-direction: row; flex: 1; min-height: 0; overflow: hidden; }
    .sentence-card { transition: border-color 0.2s, background 0.2s; }
    .sentence-card:hover { border-color: #e2e8f0; }
    .active-sentence { border-color: #3b82f6 !important; background: #eff6ff !important; }
  `],
  template: `
    <!-- Sentences panel (direct child of :host, which is the flex row) -->
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">

        <!-- Top bar -->
        <div class="flex flex-col gap-4 p-6 border-b border-gray-100 bg-white">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <h1 class="text-lg font-bold text-gray-900">YouTube Subtitle Learner</h1>
          </div>

          <!-- URL + controls row -->
          <div class="flex gap-2 flex-wrap">
            <input
              type="text"
              [(ngModel)]="url"
              (keydown.enter)="fetchTranscript()"
              placeholder="https://www.youtube.com/watch?v=..."
              class="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <select [(ngModel)]="lang"
              class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              @for (l of langOptions; track l.code) {
                <option [value]="l.code">{{ l.label }}</option>
              }
            </select>

            <select [(ngModel)]="origLang"
              class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              title="Also show original language">
              <option value="">No original language</option>
              @for (l of langOptions; track l.code) {
                <option [value]="l.code">+ {{ l.label }}</option>
              }
            </select>

            <button
              (click)="fetchTranscript()"
              [disabled]="fetching() || !url.trim()"
              class="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
              @if (fetching()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Fetching…
              } @else {
                Fetch
              }
            </button>
          </div>

          @if (fetchError()) {
            <div class="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
              {{ fetchError() }}
            </div>
          }

          <!-- Video info bar -->
          @if (transcript()) {
            <div class="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <img
                [src]="'https://img.youtube.com/vi/' + transcript()!.videoId + '/mqdefault.jpg'"
                class="w-36 h-20 object-cover rounded-lg shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 truncate">{{ transcript()!.title }}</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ transcript()!.sentences.length }} sentences · {{ lang.toUpperCase() }} subtitles
                  @if (transcript()!.origLang) { · + {{ transcript()!.origLang!.toUpperCase() }} }
                </p>
                <div class="flex items-center gap-2 mt-2">
                  <button
                    (click)="togglePlayer()"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                    [class]="playerOpen()
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-red-500 text-white hover:bg-red-600'">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    {{ playerOpen() ? 'Close Player' : 'Watch Here' }}
                  </button>
                  <a [href]="'https://youtu.be/' + transcript()!.videoId" target="_blank"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors">
                    Open on YouTube
                  </a>
                </div>
              </div>
              <!-- Search -->
              <div class="relative w-56 shrink-0">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input type="text"
                  [ngModel]="search()" (ngModelChange)="search.set($event)"
                  placeholder="Search sentences..."
                  class="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          }
        </div>

        <!-- Sentences list -->
        @if (transcript()) {
          <div #sentencesList class="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            @for (sentence of filteredSentences(); track $index) {
              <div
                #sentenceEl
                [attr.data-time]="sentence.startTime"
                class="sentence-card shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer"
                [class.active-sentence]="activeSentenceTime() === sentence.startTime"
                (click)="seekTo(sentence.startTime)">

                <div class="flex items-start gap-3 px-4 py-3">
                  <span class="text-xs font-mono text-gray-400 shrink-0 mt-0.5 w-10 pt-0.5">
                    {{ formatTime(sentence.startTime) }}
                  </span>

                  <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                    <p class="text-base text-gray-800 leading-relaxed">{{ sentence.text }}</p>
                    @if (sentence.originalText) {
                      <p class="text-sm text-gray-500 leading-relaxed">{{ sentence.originalText }}</p>
                    }
                    <!-- Translated result inline -->
                    @if (getResult(sentence); as r) {
                      <div class="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
                        <p class="text-sm font-medium text-blue-700">{{ r.result.translation }}</p>
                        @if (r.result.transliteration) {
                          <p class="text-xs text-gray-400 italic">{{ r.result.transliteration }}</p>
                        }
                        <!-- Word chips -->
                        <div class="flex flex-wrap gap-1.5 mt-1">
                          @for (word of r.result.breakdown; track word.word) {
                            <button
                              (click)="$event.stopPropagation(); saveWord(word)"
                              [title]="'Add: ' + word.meaning"
                              class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all"
                              [class]="isWordSaved(word.word)
                                ? 'bg-purple-50 border-purple-300 text-purple-700 cursor-default'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'">
                              <span class="font-semibold">{{ word.word }}</span>
                              <span class="text-gray-400 font-normal">{{ word.meaning }}</span>
                              @if (isWordSaved(word.word)) {
                                <svg class="w-3 h-3 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              } @else {
                                <svg class="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                              }
                            </button>
                          }
                          <button
                            (click)="$event.stopPropagation(); saveAllWords(r)"
                            class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-dashed border-gray-300 text-gray-500 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 transition-all">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add all
                          </button>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Action buttons (right column) -->
                  <div class="shrink-0 flex flex-col items-end gap-1.5">

                    <!-- Breakdown — disappears once result loads -->
                    @if (!getResult(sentence)) {
                      <button
                        (click)="$event.stopPropagation(); translateSentence(sentence)"
                        [disabled]="isTranslating(sentence)"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-colors disabled:opacity-50">
                        @if (isTranslating(sentence)) {
                          <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Analysing…
                        } @else {
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                          </svg>
                          Breakdown
                        }
                      </button>
                    }

                    <!-- Save phrase -->
                    <button
                      (click)="$event.stopPropagation(); savePhrase(sentence)"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                      [class]="phraseSvc.isSaved(sentence.text, langLabel())
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'">
                      @if (phraseSvc.isSaved(sentence.text, langLabel())) {
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.593 3.322c1.1.128 1.907 1.032 1.907 2.277v14.401l-7.5-2.5-7.5 2.5V5.599c0-1.245.907-2.15 1.907-2.277a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                        Saved
                      } @else {
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.032 1.907 2.277v14.401l-7.5-2.5-7.5 2.5V5.599c0-1.245.907-2.15 1.907-2.277a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                        Save
                      }
                    </button>

                  </div>
                </div>

              </div>
            }

            @if (filteredSentences().length === 0 && search()) {
              <p class="text-sm text-gray-400 text-center py-12">No sentences match "{{ search() }}"</p>
            }
          </div>
        }
      </div>

      <!-- YouTube player panel (sticky right side) -->
      @if (playerOpen() && transcript()) {
        <div class="w-96 shrink-0 border-l border-gray-100 bg-white flex flex-col overflow-hidden">
          <div class="aspect-video w-full bg-black">
            <div id="yt-player" class="w-full h-full"></div>
          </div>
          <div class="p-4 flex flex-col gap-2">
            <p class="text-xs font-semibold text-gray-700 truncate">{{ transcript()!.title }}</p>
            @if (activeSentenceTime() !== null) {
              @if (getActiveSentence(); as s) {
                <div class="bg-blue-50 rounded-lg p-3 flex flex-col gap-1.5">
                  <p class="text-base font-medium text-gray-800 leading-snug">{{ s.text }}</p>
                  @if (s.originalText) {
                    <p class="text-sm text-gray-500 leading-snug">{{ s.originalText }}</p>
                  }
                </div>
              }
            }
          </div>
        </div>
      }

  `,
})
export class SubtitlesComponent implements OnDestroy {
  @ViewChild('sentencesList') sentencesList!: ElementRef<HTMLElement>;

  private readonly http = inject(HttpClient);
  private readonly flashcardsSvc = inject(FlashcardsService);
  readonly phraseSvc = inject(PhrasesService);
  private readonly prefsSvc = inject(PreferencesService);

  readonly formatTime = formatTime;
  readonly langOptions = LANG_OPTIONS;

  url = '';
  lang = 'en';
  origLang = '';

  readonly transcript = signal<TranscriptResponse | null>(null);
  readonly fetching = signal(false);
  readonly fetchError = signal<string | null>(null);
  readonly translating = signal<Set<number>>(new Set());
  readonly results = signal<SentenceResult[]>([]);
  readonly search = signal('');
  readonly playerOpen = signal(false);
  readonly activeSentenceTime = signal<number | null>(null);

  private player: any = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  readonly targetLang = () => this.prefsSvc.prefs().target_lang;

  readonly filteredSentences = computed(() => {
    const t = this.transcript();
    if (!t) return [];
    const q = this.search().trim().toLowerCase();
    if (!q) return t.sentences;
    return t.sentences.filter(s =>
      s.text.toLowerCase().includes(q) ||
      (s.originalText ?? '').toLowerCase().includes(q)
    );
  });

  readonly getActiveSentence = () => {
    const t = this.transcript();
    const time = this.activeSentenceTime();
    if (!t || time === null) return null;
    return t.sentences.find(s => s.startTime === time) ?? null;
  };

  ngOnDestroy(): void {
    this.stopPolling();
    if (this.player?.destroy) this.player.destroy();
  }

  fetchTranscript(): void {
    if (!this.url.trim()) return;
    this.fetching.set(true);
    this.fetchError.set(null);
    this.transcript.set(null);
    this.results.set([]);
    this.playerOpen.set(false);
    this.stopPolling();

    const params = new URLSearchParams({ url: this.url, lang: this.lang });
    if (this.origLang && this.origLang !== this.lang) params.set('origLang', this.origLang);

    this.http.get<TranscriptResponse>(`${environment.apiBase}/transcript?${params}`)
      .subscribe({
        next: (data) => { this.transcript.set(data); this.fetching.set(false); },
        error: (err) => {
          this.fetchError.set(err.error?.error ?? 'Could not fetch transcript.');
          this.fetching.set(false);
        },
      });
  }

  togglePlayer(): void {
    if (this.playerOpen()) {
      this.playerOpen.set(false);
      this.stopPolling();
      if (this.player?.destroy) { this.player.destroy(); this.player = null; }
    } else {
      this.playerOpen.set(true);
      setTimeout(() => this.initPlayer(), 200);
    }
  }

  private initPlayer(): void {
    const videoId = this.transcript()?.videoId;
    if (!videoId) return;

    const setup = () => {
      this.player = new YT.Player('yt-player', {
        videoId,
        playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => this.startPolling(),
        },
      });
    };

    if (typeof YT !== 'undefined' && YT.Player) {
      setup();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = setup;
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      if (!this.player?.getCurrentTime) return;
      const current = this.player.getCurrentTime();
      const sentences = this.transcript()?.sentences ?? [];

      // Find the sentence whose window contains current time
      let active: Sentence | null = null;
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        const end = s.startTime + s.duration + 0.5;
        if (s.startTime <= current && current < end) {
          active = s;
          break;
        }
      }

      const newTime = active?.startTime ?? null;
      if (newTime !== this.activeSentenceTime()) {
        this.activeSentenceTime.set(newTime);
        if (newTime !== null) this.scrollToSentence(newTime);
      }
    }, 500);
  }

  private stopPolling(): void {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  private scrollToSentence(startTime: number): void {
    setTimeout(() => {
      const el = this.sentencesList?.nativeElement?.querySelector(`[data-time="${startTime}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  seekTo(startTime: number): void {
    if (this.player?.seekTo) {
      this.player.seekTo(startTime, true);
      this.player.playVideo();
    }
  }

  translateSentence(sentence: Sentence): void {
    if (this.isTranslated(sentence) || this.isTranslating(sentence)) return;
    this.translating.update(s => new Set([...s, sentence.startTime]));

    this.http.post<TranslationResult>(`${environment.apiBase}/transcript/translate-sentence`, {
      text: sentence.text,
      targetLang: this.targetLang(),
      context: this.prefsSvc.prefs().default_context,
    }).subscribe({
      next: (result) => {
        this.results.update(r => [...r, { sentence, result }]);
        this.translating.update(s => { const n = new Set(s); n.delete(sentence.startTime); return n; });
      },
      error: () => {
        this.translating.update(s => { const n = new Set(s); n.delete(sentence.startTime); return n; });
      },
    });
  }

  isTranslating(sentence: Sentence): boolean { return this.translating().has(sentence.startTime); }
  isTranslated(sentence: Sentence): boolean { return this.results().some(r => r.sentence.startTime === sentence.startTime); }
  getResult(sentence: Sentence): SentenceResult | undefined { return this.results().find(r => r.sentence.startTime === sentence.startTime); }

  saveWord(word: any): void { this.flashcardsSvc.addWord(word, this.targetLang()); }
  saveAllWords(sr: SentenceResult): void { sr.result.breakdown.forEach(w => this.saveWord(w)); }
  isWordSaved(word: string): boolean { return this.flashcardsSvc.isAdded(word, this.targetLang()); }

  langLabel(): string {
    return LANG_OPTIONS.find(l => l.code === this.lang)?.label ?? this.lang;
  }

  savePhrase(sentence: Sentence): void {
    this.phraseSvc.savePhrase({
      phrase: sentence.text,
      language: this.langLabel(),
      translation: sentence.originalText ?? undefined,
      source: 'subtitle',
      videoId: this.transcript()?.videoId,
      videoTitle: this.transcript()?.title,
    });
  }
}
