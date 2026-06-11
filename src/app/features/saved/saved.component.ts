import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlashcardsService, Flashcard } from '../flashcards/flashcards.service';

const POS_BADGE: Record<string, string> = {
  noun:        'bg-blue-50 text-blue-600 border-blue-200',
  verb:        'bg-emerald-50 text-emerald-600 border-emerald-200',
  adjective:   'bg-purple-50 text-purple-600 border-purple-200',
  adj:         'bg-purple-50 text-purple-600 border-purple-200',
  adverb:      'bg-amber-50 text-amber-600 border-amber-200',
  adv:         'bg-amber-50 text-amber-600 border-amber-200',
  preposition: 'bg-rose-50 text-rose-600 border-rose-200',
  prep:        'bg-rose-50 text-rose-600 border-rose-200',
  conjunction: 'bg-teal-50 text-teal-600 border-teal-200',
  conj:        'bg-teal-50 text-teal-600 border-teal-200',
  phrase:      'bg-orange-50 text-orange-600 border-orange-200',
  expression:  'bg-orange-50 text-orange-600 border-orange-200',
};

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    :host { display: flex; flex: 1; min-height: 0; overflow: hidden; }
  `],
  template: `
    <!-- ── Left panel: word list ── -->
    <div class="w-72 shrink-0 flex flex-col border-r border-gray-100 bg-white overflow-hidden">

      <!-- Header -->
      <div class="p-4 border-b border-gray-100 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-base font-bold text-gray-900">Saved Words</h1>
            <p class="text-xs text-gray-400 mt-0.5">
              @if (svc.loaded()) {
                {{ totalCount() }} word{{ totalCount() === 1 ? '' : 's' }}
              } @else {
                Loading…
              }
            </p>
          </div>
          @if (totalCount() > 0) {
            <span class="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
              {{ groupCount() }} lang{{ groupCount() === 1 ? '' : 's' }}
            </span>
          }
        </div>

        <!-- Search -->
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            [ngModel]="search()" (ngModelChange)="search.set($event)"
            placeholder="Search words…"
            class="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
        </div>
      </div>

      <!-- Word list -->
      <div class="flex-1 overflow-y-auto">

        @if (!svc.loaded()) {
          <!-- Loading skeleton -->
          <div class="p-5 flex flex-col gap-4">
            @for (_ of [1,2,3,4,5,6]; track $index) {
              <div class="flex flex-col gap-1.5 animate-pulse">
                <div class="flex items-center gap-2">
                  <div class="h-3.5 bg-gray-100 rounded w-20"></div>
                  <div class="h-3 bg-gray-100 rounded w-8"></div>
                </div>
                <div class="h-3 bg-gray-100 rounded w-36"></div>
              </div>
            }
          </div>

        } @else if (totalCount() === 0) {
          <!-- No words saved yet -->
          <div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <svg class="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24"
              stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.032 1.907 2.277v14.401l-7.5-2.5-7.5 2.5V5.599c0-1.245.907-2.15 1.907-2.277a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            <div>
              <p class="text-sm font-semibold text-gray-500">No saved words yet</p>
              <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                Save words while translating<br>to build your vocabulary.
              </p>
            </div>
            <a routerLink="/translate"
              class="text-xs font-semibold text-blue-600 hover:underline">
              Go translate something →
            </a>
          </div>

        } @else if (filteredCount() === 0) {
          <!-- No search results -->
          <div class="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <p class="text-sm font-semibold text-gray-500">No matches</p>
            <p class="text-xs text-gray-400">Try a different search term.</p>
          </div>

        } @else {
          @for (group of grouped(); track group.lang) {

            <!-- Language group header (sticky) -->
            <div class="sticky top-0 z-10 px-4 py-1.5 bg-gray-50 border-b border-gray-100
                        flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {{ group.lang }}
              </span>
              <span class="text-[11px] text-gray-400">{{ group.cards.length }}</span>
            </div>

            @for (card of group.cards; track card.id) {
              <div
                (click)="select(card)"
                class="flex items-start gap-2.5 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors"
                [class]="selected()?.id === card.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-50'">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="text-sm font-semibold text-gray-900 truncate">{{ card.word }}</span>
                    @if (card.pos) {
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide shrink-0"
                        [class]="posBadge(card.pos)">{{ card.pos }}</span>
                    }
                  </div>
                  <p class="text-xs text-gray-500 truncate">{{ card.meaning }}</p>
                </div>
              </div>
            }

          }
        }

      </div>
    </div>

    <!-- ── Right panel: word detail ── -->
    <div class="flex-1 overflow-y-auto bg-[#f8f9ff]">

      @if (!selected()) {
        <!-- Nothing selected -->
        <div class="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
          <div class="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm
                      flex items-center justify-center">
            <svg class="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24"
              stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.032 1.907 2.277v14.401l-7.5-2.5-7.5 2.5V5.599c0-1.245.907-2.15 1.907-2.277a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </div>
          <div>
            <p class="text-base font-semibold text-gray-500">Select a word to review it</p>
            <p class="text-sm text-gray-400 mt-1">
              Click any word from the list to see its full detail.
            </p>
          </div>
        </div>

      } @else {
        <!-- Word detail -->
        <div class="max-w-xl mx-auto p-8 flex flex-col gap-5">

          <!-- Word heading + POS -->
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h2 class="text-4xl font-bold text-gray-900 break-words leading-tight">
                {{ selected()!.word }}
              </h2>
              <p class="text-sm text-gray-400 mt-2">{{ selected()!.language }}</p>
            </div>
            @if (selected()!.pos) {
              <span class="mt-1.5 shrink-0 text-sm font-bold px-3 py-1.5 rounded-lg border"
                [class]="posBadge(selected()!.pos)">
                {{ selected()!.pos }}
              </span>
            }
          </div>

          <!-- Meaning -->
          <div class="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-1.5 shadow-sm">
            <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Meaning</p>
            <p class="text-base text-gray-800">{{ selected()!.meaning }}</p>
          </div>

          <!-- Explanation -->
          @if (selected()!.explanation) {
            <div class="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-1.5 shadow-sm">
              <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Explanation</p>
              <p class="text-sm text-gray-600 leading-relaxed">{{ selected()!.explanation }}</p>
            </div>
          }

          <!-- Examples -->
          @if (selected()!.examples?.length) {
            <div class="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 shadow-sm">
              <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Examples</p>
              <ul class="flex flex-col gap-3">
                @for (ex of selected()!.examples; track ex) {
                  <li class="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-[7px]"></span>
                    {{ ex }}
                  </li>
                }
              </ul>
            </div>
          }

          <!-- Remove action -->
          <div class="pt-2 border-t border-gray-200">
            <button
              (click)="remove(selected()!)"
              class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                     text-red-500 border border-red-200 rounded-lg
                     hover:bg-red-50 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Remove from saved
            </button>
          </div>

        </div>
      }

    </div>
  `,
})
export class SavedComponent {
  protected readonly svc = inject(FlashcardsService);

  readonly search = signal('');
  readonly selected = signal<Flashcard | null>(null);

  readonly grouped = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cards = this.svc.cards();
    const filtered = q
      ? cards.filter(c =>
          c.word.toLowerCase().includes(q) ||
          c.meaning.toLowerCase().includes(q)
        )
      : cards;

    const map = new Map<string, Flashcard[]>();
    for (const card of filtered) {
      const lang = card.language || 'Unknown';
      if (!map.has(lang)) map.set(lang, []);
      map.get(lang)!.push(card);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([lang, cards]) => ({ lang, cards }));
  });

  readonly totalCount  = computed(() => this.svc.cards().length);
  readonly filteredCount = computed(() => this.grouped().reduce((n, g) => n + g.cards.length, 0));
  readonly groupCount  = computed(() => new Set(this.svc.cards().map(c => c.language || 'Unknown')).size);

  posBadge(pos: string): string {
    return POS_BADGE[pos?.toLowerCase()] ?? 'bg-gray-50 text-gray-500 border-gray-200';
  }

  select(card: Flashcard): void {
    this.selected.set(card);
  }

  remove(card: Flashcard): void {
    if (this.selected()?.id === card.id) this.selected.set(null);
    this.svc.removeCard(card.id);
  }
}
