import {
  Component, inject, signal, computed, OnDestroy, OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FlashcardsService, Flashcard, ReviewInput } from './flashcards.service';
import { PreferencesService } from '../../core/preferences/preferences.service';

type Rating = 'still-learning' | 'getting-there' | 'mastered';
type SessionMode = 'due' | 'practice';

interface SessionCard {
  card: Flashcard;
  rating: Rating | null;
}

const TIPS = [
  'Spaced Repetition: Mastering words in short, daily bursts is 3x more effective than long cram sessions.',
  'Say the word out loud when you flip the card — speaking activates a different memory pathway.',
  'Try to use a new word in a sentence before rating it. Context beats rote memorisation.',
  'Don\'t skip "Still Learning" cards — reviewing them more frequently is exactly how spaced repetition works.',
];

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .card-scene { perspective: 1000px; }
    .card-inner {
      position: relative; width: 100%; height: 100%;
      transform-style: preserve-3d;
      transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
    }
    .card-inner.flipped { transform: rotateY(180deg); }
    .card-face {
      position: absolute; width: 100%; height: 100%;
      backface-visibility: hidden; -webkit-backface-visibility: hidden;
      border-radius: 1rem;
    }
    .card-back { transform: rotateY(180deg); }
  `],
  template: `
    @if (cards().length === 0) {
      <div class="flex flex-col items-center justify-center h-full gap-4 text-gray-400 p-6">
        <svg class="w-14 h-14 opacity-40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
        </svg>
        <p class="text-lg font-semibold text-gray-600">No flashcards yet</p>
        <p class="text-sm text-center max-w-xs text-gray-400">
          Save words from the breakdown panel while translating and they'll appear here.
        </p>
        <a routerLink="/translate"
          class="mt-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
          Start Translating
        </a>
      </div>

    } @else if (!inSession() && !sessionDone()) {
      <!-- Lobby: filter by language + category, then start -->
      <div class="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
        <div>
          <h1 class="text-xl font-bold text-gray-900">My Flashcards</h1>
          <p class="text-sm text-gray-400 mt-0.5">{{ cards().length }} cards across {{ availableLanguages().length - 1 }} language{{ availableLanguages().length - 1 === 1 ? '' : 's' }}</p>
        </div>

        <!-- Review Due (spaced repetition) -->
        <div class="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 flex items-center gap-5">
          <div class="flex flex-col">
            <span class="text-3xl font-bold text-blue-600">{{ dueCount() }}</span>
            <span class="text-sm text-gray-600">card{{ dueCount() === 1 ? '' : 's' }} due for review</span>
          </div>
          <button (click)="startDueSession()"
            [disabled]="dueCount() === 0"
            class="ml-auto px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {{ dueCount() === 0 ? 'All caught up 🎉' : 'Review Due' }}
          </button>
        </div>

        <!-- Free Practice (does not affect review scheduling) -->
        <div class="flex items-center gap-2 pt-2">
          <p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Free Practice</p>
          <span class="text-[11px] text-gray-400 normal-case">— doesn't change your due dates</span>
        </div>

        <!-- Language tabs -->
        <div class="flex flex-col gap-2">
          <p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Language</p>
          <div class="flex flex-wrap gap-2">
            @for (lang of availableLanguages(); track lang) {
              <button (click)="selectLang(lang)"
                class="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                [class]="selectedLang() === lang
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'">
                {{ lang }}
              </button>
            }
          </div>
        </div>

        <!-- Category chips -->
        @if (availableCategories().length > 1) {
          <div class="flex flex-col gap-2">
            <p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Category</p>
            <div class="flex flex-wrap gap-2">
              @for (cat of availableCategories(); track cat) {
                <button (click)="selectCategory(cat)"
                  class="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                  [class]="selectedCategory() === cat
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'">
                  {{ cat }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Card count + start -->
        <div class="flex items-center gap-4 pt-2">
          <div class="flex-1 bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <p class="text-3xl font-bold text-blue-600">{{ filteredCards().length }}</p>
            <p class="text-sm text-gray-500 mt-0.5">cards selected</p>
          </div>
          <button (click)="startFiltered()"
            [disabled]="filteredCards().length === 0"
            class="flex-1 py-4 bg-white border border-blue-200 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Start Practice
          </button>
        </div>
      </div>

    } @else if (sessionDone()) {
      <div class="flex flex-col items-center justify-center h-full gap-5 p-6">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div class="text-center">
          <h2 class="text-xl font-bold text-gray-900">Session Complete!</h2>
          <p class="text-sm text-gray-500 mt-1">You reviewed {{ sessionCards().length }} cards in {{ formattedTime() }}</p>
        </div>
        <div class="flex gap-8 text-center">
          <div class="flex flex-col gap-1">
            <span class="text-3xl font-bold text-green-600">{{ masteredCount() }}</span>
            <span class="text-xs text-gray-500">Mastered</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-3xl font-bold text-blue-500">{{ gettingThereCount() }}</span>
            <span class="text-xs text-gray-500">Getting There</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-3xl font-bold text-red-500">{{ stillLearningCount() }}</span>
            <span class="text-xs text-gray-500">Still Learning</span>
          </div>
        </div>

        @if (sessionMode() === 'due' && nextReviewSummary().length > 0) {
          <div class="w-full max-w-sm flex flex-col gap-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p class="text-xs font-bold tracking-wider text-gray-400 uppercase text-center">Next Review</p>
            @for (bucket of nextReviewSummary(); track bucket.label) {
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">{{ bucket.label }}</span>
                <span class="font-semibold text-gray-900">{{ bucket.count }} card{{ bucket.count === 1 ? '' : 's' }}</span>
              </div>
            }
          </div>
        }

        <div class="flex gap-3 flex-wrap justify-center">
          <button (click)="restartSession()"
            class="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Study Again
          </button>
          <button (click)="goToLobby()"
            class="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            Change Filters
          </button>
          <a routerLink="/translate"
            class="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            Add More Words
          </a>
        </div>
      </div>

    } @else {
      <div class="flex h-full">

        <!-- Main study area -->
        <div class="flex-1 flex flex-col p-6 gap-5 min-w-0">

          <!-- Header -->
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col gap-1.5">
              <h1 class="text-xl font-bold text-gray-900">My Flashcards</h1>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {{ selectedLang() === 'All' ? 'All Languages' : selectedLang() }}
                </span>
                @if (selectedCategory() !== 'All') {
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    {{ selectedCategory() }}
                  </span>
                }
              </div>
            </div>
            <button (click)="closeSession()"
              class="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors shrink-0">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Close Session
            </button>
          </div>

          <!-- Progress bar -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Progress</span>
              <span class="text-sm font-semibold text-blue-600">
                {{ currentIndex() + 1 }} / {{ sessionCards().length }} Cards
              </span>
            </div>
            <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-blue-600 rounded-full transition-all duration-500"
                [style.width.%]="progressPct()">
              </div>
            </div>
          </div>

          <!-- Card + nav -->
          <div class="flex-1 flex flex-col items-center justify-center gap-6">
            <div class="w-full max-w-2xl flex items-center gap-4">

              <button (click)="prev()" [disabled]="currentIndex() === 0"
                class="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>

              <!-- Flip card -->
              <div class="card-scene flex-1 h-72 cursor-pointer select-none" (click)="flip()">
                <div class="card-inner" [class.flipped]="isFlipped()">

                  <!-- Front -->
                  <div class="card-face bg-blue-600 flex flex-col items-center justify-center gap-3 shadow-lg">
                    <span class="text-xs font-bold tracking-widest text-blue-200 uppercase">
                      {{ currentCard().card.language }}
                    </span>
                    <h2 class="text-5xl font-bold text-white tracking-tight">
                      {{ currentCard().card.word }}
                    </h2>
                    <span class="px-2.5 py-1 rounded-full bg-blue-500 text-blue-100 text-xs font-semibold">
                      {{ currentCard().card.pos }}
                    </span>
                    <p class="absolute bottom-5 text-xs text-blue-300 flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
                      </svg>
                      Click to reveal
                    </p>
                  </div>

                  <!-- Back -->
                  <div class="card-face card-back bg-white border border-gray-100 shadow-lg flex flex-col justify-center p-8 gap-4">
                    <div class="flex items-baseline gap-3">
                      <h2 class="text-3xl font-bold text-gray-900">{{ currentCard().card.word }}</h2>
                      <span class="text-base text-gray-400 italic">{{ currentCard().card.meaning }}</span>
                    </div>
                    <p class="text-sm text-gray-600 leading-relaxed">{{ currentCard().card.explanation }}</p>
                    @if (currentCard().card.examples.length > 0) {
                      <div class="flex flex-col gap-1.5 pt-3 border-t border-gray-100">
                        @for (ex of currentCard().card.examples; track ex) {
                          <p class="text-sm text-gray-400 italic">"{{ ex }}"</p>
                        }
                      </div>
                    }
                  </div>

                </div>
              </div>

              <button (click)="next()" [disabled]="currentIndex() === sessionCards().length - 1"
                class="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>

            </div>

            <!-- Rating buttons -->
            <div class="flex gap-3 w-full max-w-2xl">
              @for (btn of ratingButtons; track btn.value) {
                <button (click)="rate(btn.value)"
                  class="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all"
                  [class]="currentCard().rating === btn.value ? btn.activeClass : btn.idleClass">
                  <span class="text-xl">{{ btn.emoji }}</span>
                  {{ btn.label }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Right panel -->
        <div class="w-52 shrink-0 border-l border-gray-100 bg-white flex flex-col gap-6 p-5 overflow-y-auto">

          <div class="flex flex-col gap-3">
            <h3 class="text-xs font-bold tracking-wider text-gray-500 uppercase">Session Stats</h3>
            <div class="flex flex-col gap-2">
              @for (stat of stats(); track stat.label) {
                <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                  <span class="text-sm text-gray-600">{{ stat.label }}</span>
                  <span class="text-sm font-bold" [class]="stat.color">{{ stat.value }}</span>
                </div>
              }
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-xs font-bold tracking-wider text-gray-500 uppercase">Breakdown</h3>
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-1.5 text-green-600">
                  <span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Mastered
                </span>
                <span class="font-bold">{{ masteredCount() }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-1.5 text-blue-500">
                  <span class="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>Getting There
                </span>
                <span class="font-bold">{{ gettingThereCount() }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-1.5 text-red-500">
                  <span class="w-2 h-2 rounded-full bg-red-400 inline-block"></span>Still Learning
                </span>
                <span class="font-bold">{{ stillLearningCount() }}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-xs font-bold tracking-wider text-gray-500 uppercase">Quick Tip</h3>
            <div class="bg-blue-50 rounded-lg p-3">
              <p class="text-xs text-blue-800 leading-relaxed">{{ currentTip() }}</p>
            </div>
          </div>

        </div>
      </div>
    }
  `,
})
export class FlashcardsComponent implements OnInit, OnDestroy {
  private readonly flashcardsSvc = inject(FlashcardsService);
  private readonly prefsSvc = inject(PreferencesService);

  readonly cards = this.flashcardsSvc.cards;
  readonly dueCount = computed(() => this.flashcardsSvc.dueCards().length);

  readonly selectedLang = signal<string>('All');
  readonly selectedCategory = signal<string>('All');

  readonly availableLanguages = computed(() => {
    const langs = [...new Set(this.cards().map(c => c.language))].sort();
    return ['All', ...langs];
  });

  readonly availableCategories = computed(() => {
    const base = this.cards().filter(
      c => this.selectedLang() === 'All' || c.language === this.selectedLang()
    );
    const cats = [...new Set(base.map(c => c.category).filter(Boolean))].sort();
    return ['All', ...cats];
  });

  readonly filteredCards = computed(() => {
    return this.cards().filter(c => {
      const langMatch = this.selectedLang() === 'All' || c.language === this.selectedLang();
      const catMatch = this.selectedCategory() === 'All' || c.category === this.selectedCategory();
      return langMatch && catMatch;
    });
  });

  readonly inSession = signal(false);
  readonly sessionMode = signal<SessionMode>('due');
  readonly sessionCards = signal<SessionCard[]>([]);
  readonly currentIndex = signal(0);
  readonly isFlipped = signal(false);
  readonly sessionDone = signal(false);
  readonly elapsedSeconds = signal(0);
  readonly currentTip = signal(TIPS[0]);
  readonly reviewedCardIds = signal<string[]>([]);

  // Next-review schedule shown on the completion screen (due sessions only).
  // Reads cards() so it updates reactively once submitReviews() patches state.
  readonly nextReviewSummary = computed(() => {
    const ids = new Set(this.reviewedCardIds());
    if (ids.size === 0) return [];
    const now = Date.now();
    const byDays = new Map<number, number>();
    for (const card of this.cards()) {
      if (!ids.has(card.id)) continue;
      const days = Math.max(0, Math.round((new Date(card.dueAt).getTime() - now) / 86_400_000));
      byDays.set(days, (byDays.get(days) ?? 0) + 1);
    }
    return [...byDays.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([days, count]) => ({ label: this.formatDueLabel(days), count }));
  });

  private formatDueLabel(days: number): string {
    if (days <= 0) return 'Later today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  readonly ratingButtons = [
    {
      value: 'still-learning' as Rating,
      label: 'Still Learning',
      emoji: '😟',
      activeClass: 'border-2 border-red-400 bg-red-50 text-red-500 font-semibold',
      idleClass: 'border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-500',
    },
    {
      value: 'getting-there' as Rating,
      label: 'Getting There',
      emoji: '😐',
      activeClass: 'border-2 border-blue-400 bg-blue-50 text-blue-600 font-semibold',
      idleClass: 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600',
    },
    {
      value: 'mastered' as Rating,
      label: 'Mastered',
      emoji: '😊',
      activeClass: 'border-2 border-green-400 bg-green-50 text-green-600 font-semibold',
      idleClass: 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-600',
    },
  ];

  readonly currentCard = computed(() => this.sessionCards()[this.currentIndex()]);
  readonly progressPct = computed(() =>
    ((this.currentIndex() + 1) / Math.max(this.sessionCards().length, 1)) * 100
  );
  readonly remaining = computed(() =>
    this.sessionCards().filter(c => c.rating === null).length
  );
  readonly masteredCount = computed(() =>
    this.sessionCards().filter(c => c.rating === 'mastered').length
  );
  readonly gettingThereCount = computed(() =>
    this.sessionCards().filter(c => c.rating === 'getting-there').length
  );
  readonly stillLearningCount = computed(() =>
    this.sessionCards().filter(c => c.rating === 'still-learning').length
  );
  readonly accuracyPct = computed(() => {
    const rated = this.sessionCards().filter(c => c.rating !== null).length;
    if (rated === 0) return 0;
    return Math.round(((this.masteredCount() + this.gettingThereCount()) / rated) * 100);
  });
  readonly formattedTime = computed(() => {
    const s = this.elapsedSeconds();
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  });
  readonly uniqueLanguages = computed(() => {
    const langs = [...new Set(this.cards().map(c => c.language))];
    return langs.join(' · ');
  });
  readonly stats = computed(() => [
    { label: 'Remaining', value: String(this.remaining()), color: 'text-gray-900' },
    { label: 'Accuracy', value: `${this.accuracyPct()}%`, color: 'text-blue-600' },
    { label: 'Time', value: this.formattedTime(), color: 'text-gray-900' },
  ]);

  ngOnInit(): void {
    // Start at lobby so user can pick language/category first
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private beginSession(source: Flashcard[], mode: SessionMode): void {
    let cards = source.map(card => ({ card, rating: null as Rating | null }));
    if (this.prefsSvc.prefs().flashcard_shuffle) {
      cards = cards.sort(() => Math.random() - 0.5);
    }
    this.sessionMode.set(mode);
    this.sessionCards.set(cards);
    this.reviewedCardIds.set([]);
    this.currentIndex.set(0);
    this.isFlipped.set(false);
    this.sessionDone.set(false);
    this.inSession.set(true);
    this.elapsedSeconds.set(0);
    this.currentTip.set(TIPS[Math.floor(Math.random() * TIPS.length)]);
    this.startTimer();
  }

  /** Persist the session's ratings (due sessions only) and end the session. */
  private finishSession(): void {
    this.stopTimer();
    if (this.sessionMode() === 'due') {
      const reviews: ReviewInput[] = this.sessionCards()
        .filter(c => c.rating !== null)
        .map(c => ({ cardId: c.card.id, grade: c.rating! }));
      this.reviewedCardIds.set(reviews.map(r => r.cardId));
      this.flashcardsSvc.submitReviews(reviews);
    }
    this.sessionDone.set(true);
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => this.elapsedSeconds.update(s => s + 1), 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  selectLang(lang: string): void {
    this.selectedLang.set(lang);
    this.selectedCategory.set('All');
  }

  selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }

  startDueSession(): void {
    this.beginSession(this.flashcardsSvc.dueCards(), 'due');
  }

  startFiltered(): void {
    this.beginSession(this.filteredCards(), 'practice');
  }

  flip(): void {
    this.isFlipped.update(f => !f);
  }

  prev(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
      this.isFlipped.set(false);
    }
  }

  next(): void {
    if (this.currentIndex() < this.sessionCards().length - 1) {
      this.currentIndex.update(i => i + 1);
      this.isFlipped.set(false);
    }
  }

  rate(rating: Rating): void {
    this.sessionCards.update(cards =>
      cards.map((c, i) => i === this.currentIndex() ? { ...c, rating } : c)
    );

    // Once every card has a rating, wrap up — independent of auto-advance.
    if (this.sessionCards().every(c => c.rating !== null)) {
      this.finishSession();
      return;
    }

    // Auto-advance to the next unrated card (if preference enabled).
    if (!this.prefsSvc.prefs().flashcard_auto_advance) return;

    const next = this.sessionCards().findIndex(
      (c, i) => i > this.currentIndex() && c.rating === null
    );
    if (next !== -1) {
      this.currentIndex.set(next);
      this.isFlipped.set(false);
    }
  }

  goToLobby(): void {
    this.stopTimer();
    this.inSession.set(false);
    this.sessionDone.set(false);
    this.sessionCards.set([]);
  }

  closeSession(): void {
    this.goToLobby();
  }

  restartSession(): void {
    // Due sessions re-pull whatever is still due (lapsed cards resurface);
    // practice sessions replay the current filter selection.
    if (this.sessionMode() === 'due') {
      if (this.dueCount() === 0) { this.goToLobby(); return; }
      this.startDueSession();
    } else {
      this.startFiltered();
    }
  }
}
