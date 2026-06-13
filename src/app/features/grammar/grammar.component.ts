import { Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { GrammarService, GrammarTopic } from './grammar.service';

type View = 'list' | 'lesson' | 'practice' | 'done';

@Component({
  selector: 'app-grammar',
  standalone: true,
  template: `
    @if (languages().length === 0) {
      <div class="flex flex-col items-center justify-center h-full gap-3 text-gray-400 p-6">
        <svg class="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
        <p class="text-sm">Loading grammar lessons…</p>
      </div>

    } @else if (view() === 'list') {
      <div class="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Grammar</h1>
          <p class="text-sm text-gray-400 mt-0.5">Bite-size lessons with instant practice — no scheduling, just learn.</p>
        </div>

        <!-- Language tabs -->
        <div class="flex flex-wrap gap-2">
          @for (lang of languages(); track lang.id) {
            <button (click)="selectLang(lang.id)"
              class="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
              [class]="selectedLang() === lang.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'">
              {{ lang.flag }} {{ lang.language }}
            </button>
          }
        </div>

        <!-- Topic list -->
        @if (loadingLang()) {
          <p class="text-sm text-gray-400 py-8 text-center">Loading topics…</p>
        } @else {
          <div class="flex flex-col gap-3">
            @for (topic of topics(); track topic.id) {
              <button (click)="openLesson(topic)"
                class="text-left rounded-2xl border border-gray-100 bg-white p-5 hover:border-blue-200 hover:shadow-sm transition-all flex items-start gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-base font-bold text-gray-900">{{ topic.title }}</h3>
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      [class]="topic.level === 'Beginner'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'">
                      {{ topic.level }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 leading-relaxed">{{ topic.summary }}</p>
                  <p class="text-xs text-gray-400 mt-2">{{ topic.exercises.length }} practice questions</p>
                </div>
                <svg class="w-5 h-5 text-gray-300 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            }
          </div>
        }
      </div>

    } @else if (view() === 'lesson' && currentTopic(); as topic) {
      <div class="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
        <button (click)="backToList()" class="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors w-fit">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          All topics
        </button>

        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-gray-900">{{ topic.title }}</h1>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold"
            [class]="topic.level === 'Beginner' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
            {{ topic.level }}
          </span>
        </div>

        <div class="text-[15px] text-gray-700 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded"
          [innerHTML]="topic.explanation"></div>

        @if (topic.examples.length > 0) {
          <div class="flex flex-col gap-2">
            <p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Examples</p>
            <div class="flex flex-col gap-2">
              @for (ex of topic.examples; track ex.text) {
                <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <p class="text-lg font-semibold text-gray-900">{{ ex.text }}</p>
                  @if (ex.romanization) {
                    <p class="text-sm text-gray-400 mt-0.5">{{ ex.romanization }}</p>
                  }
                  <p class="text-sm text-gray-600 mt-1">{{ ex.translation }}</p>
                </div>
              }
            </div>
          </div>
        }

        <button (click)="startPractice()"
          class="mt-1 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors w-fit">
          Practice — {{ topic.exercises.length }} questions
        </button>
      </div>

    } @else if (view() === 'practice' && currentTopic(); as topic) {
      <div class="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
        <!-- Header + progress -->
        <div class="flex items-center justify-between gap-4">
          <h1 class="text-lg font-bold text-gray-900">{{ topic.title }}</h1>
          <button (click)="backToLesson()"
            class="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Exit
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Question {{ exerciseIndex() + 1 }} / {{ topic.exercises.length }}</span>
            <span class="text-sm font-semibold text-green-600">{{ score() }} correct</span>
          </div>
          <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600 rounded-full transition-all duration-300" [style.width.%]="progressPct()"></div>
          </div>
        </div>

        @if (currentExercise(); as ex) {
          <div class="rounded-2xl border border-gray-100 bg-white p-6 flex flex-col gap-2">
            <p class="text-2xl font-bold text-gray-900 text-center leading-snug">{{ ex.prompt }}</p>
            @if (ex.promptTranslation) {
              <p class="text-sm text-gray-400 text-center">{{ ex.promptTranslation }}</p>
            }
          </div>

          <div class="flex flex-col gap-2.5">
            @for (opt of ex.options; track $index) {
              <button (click)="selectOption($index)" [disabled]="checked()"
                class="flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-base font-medium transition-colors"
                [class]="optionClass($index, ex.answerIndex)">
                <span class="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0"
                  [class]="optionMarkerClass($index, ex.answerIndex)">
                  {{ optionMarker($index, ex.answerIndex) }}
                </span>
                {{ opt }}
              </button>
            }
          </div>

          @if (checked()) {
            <div class="rounded-xl p-4 flex flex-col gap-1"
              [class]="isCorrect() ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'">
              <p class="text-sm font-bold" [class]="isCorrect() ? 'text-green-700' : 'text-red-600'">
                {{ isCorrect() ? 'Correct!' : 'Not quite' }}
              </p>
              <p class="text-sm text-gray-600">{{ ex.explanation }}</p>
            </div>
          }

          <div class="flex justify-end pt-1">
            @if (!checked()) {
              <button (click)="check()" [disabled]="selectedOption() === null"
                class="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Check
              </button>
            } @else {
              <button (click)="nextExercise()"
                class="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                {{ exerciseIndex() === topic.exercises.length - 1 ? 'See Results' : 'Next' }}
              </button>
            }
          </div>
        }
      </div>

    } @else if (view() === 'done' && currentTopic(); as topic) {
      <div class="flex flex-col items-center justify-center h-full gap-5 p-6">
        <div class="w-16 h-16 rounded-full flex items-center justify-center"
          [class]="passed() ? 'bg-green-100' : 'bg-amber-100'">
          <svg class="w-8 h-8" [class]="passed() ? 'text-green-600' : 'text-amber-600'"
            fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div class="text-center">
          <h2 class="text-xl font-bold text-gray-900">{{ topic.title }}</h2>
          <p class="text-sm text-gray-500 mt-1">You scored</p>
        </div>
        <p class="text-5xl font-bold" [class]="passed() ? 'text-green-600' : 'text-amber-600'">
          {{ score() }} / {{ topic.exercises.length }}
        </p>
        <div class="flex gap-3 flex-wrap justify-center">
          <button (click)="startPractice()"
            class="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Practice Again
          </button>
          <button (click)="backToLesson()"
            class="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            Review Lesson
          </button>
          <button (click)="backToList()"
            class="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            All Topics
          </button>
        </div>
      </div>
    }
  `,
})
export class GrammarComponent implements OnInit {
  private readonly grammarSvc = inject(GrammarService);

  readonly languages = this.grammarSvc.languages;
  readonly loadingLang = computed(() => this.grammarSvc.loadingLang() === this.selectedLang());

  readonly view = signal<View>('list');
  readonly selectedLang = signal<string>('');
  readonly currentTopic = signal<GrammarTopic | null>(null);

  readonly exerciseIndex = signal(0);
  readonly selectedOption = signal<number | null>(null);
  readonly checked = signal(false);
  readonly correctCount = signal(0);

  readonly topics = computed(() => this.grammarSvc.topicsByLang()[this.selectedLang()] ?? []);
  readonly currentExercise = computed(() => this.currentTopic()?.exercises[this.exerciseIndex()] ?? null);
  readonly score = computed(() => this.correctCount());
  readonly progressPct = computed(() => {
    const total = this.currentTopic()?.exercises.length ?? 1;
    return ((this.exerciseIndex() + (this.checked() ? 1 : 0)) / total) * 100;
  });
  readonly isCorrect = computed(() =>
    this.checked() && this.selectedOption() === this.currentExercise()?.answerIndex
  );
  readonly passed = computed(() => {
    const total = this.currentTopic()?.exercises.length ?? 0;
    return total > 0 && this.score() / total >= 0.6;
  });

  constructor() {
    // Select the first language once the (async) manifest arrives.
    effect(() => {
      const langs = this.languages();
      if (langs.length && !this.selectedLang()) {
        this.selectLang(langs[0].id);
      }
    });
  }

  ngOnInit(): void {
    this.grammarSvc.loadManifest();
  }

  selectLang(id: string): void {
    this.selectedLang.set(id);
    this.grammarSvc.ensureLanguageLoaded(id);
  }

  openLesson(topic: GrammarTopic): void {
    this.currentTopic.set(topic);
    this.view.set('lesson');
  }

  backToList(): void {
    this.view.set('list');
    this.currentTopic.set(null);
  }

  backToLesson(): void {
    this.view.set('lesson');
  }

  startPractice(): void {
    this.exerciseIndex.set(0);
    this.selectedOption.set(null);
    this.checked.set(false);
    this.correctCount.set(0);
    this.view.set('practice');
  }

  selectOption(i: number): void {
    if (this.checked()) return;
    this.selectedOption.set(i);
  }

  check(): void {
    if (this.selectedOption() === null) return;
    this.checked.set(true);
    if (this.selectedOption() === this.currentExercise()?.answerIndex) {
      this.correctCount.update(c => c + 1);
    }
  }

  nextExercise(): void {
    const total = this.currentTopic()?.exercises.length ?? 0;
    if (this.exerciseIndex() >= total - 1) {
      this.view.set('done');
      return;
    }
    this.exerciseIndex.update(i => i + 1);
    this.selectedOption.set(null);
    this.checked.set(false);
  }

  // ---- Option styling helpers ----

  optionClass(i: number, answerIndex: number): string {
    if (this.checked()) {
      if (i === answerIndex) return 'border-green-400 bg-green-50 text-green-700';
      if (i === this.selectedOption()) return 'border-red-300 bg-red-50 text-red-600';
      return 'border-gray-200 bg-white text-gray-400';
    }
    return this.selectedOption() === i
      ? 'border-blue-400 bg-blue-50 text-blue-700'
      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50';
  }

  optionMarkerClass(i: number, answerIndex: number): string {
    if (this.checked()) {
      if (i === answerIndex) return 'border-green-400 bg-green-400 text-white';
      if (i === this.selectedOption()) return 'border-red-300 bg-red-300 text-white';
      return 'border-gray-200 text-gray-300';
    }
    return this.selectedOption() === i
      ? 'border-blue-400 bg-blue-400 text-white'
      : 'border-gray-300 text-gray-400';
  }

  optionMarker(i: number, answerIndex: number): string {
    if (this.checked()) {
      if (i === answerIndex) return '✓';
      if (i === this.selectedOption()) return '✕';
    }
    return String.fromCharCode(65 + i); // A, B, C, D
  }
}
