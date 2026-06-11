import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PhrasesService, SavedPhrase } from './phrases.service';

@Component({
  selector: 'app-glossary',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    :host { display: flex; flex: 1; min-height: 0; overflow: hidden; }
  `],
  template: `
    <!-- ── Left panel: phrase list ── -->
    <div class="w-72 shrink-0 flex flex-col border-r border-gray-100 bg-white overflow-hidden">

      <!-- Header -->
      <div class="p-4 border-b border-gray-100 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-base font-bold text-gray-900">Phrasebook</h1>
            <p class="text-xs text-gray-400 mt-0.5">
              @if (svc.loaded()) {
                {{ totalCount() }} phrase{{ totalCount() === 1 ? '' : 's' }}
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
            placeholder="Search phrases…"
            class="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
        </div>
      </div>

      <!-- Phrase list -->
      <div class="flex-1 overflow-y-auto">

        @if (!svc.loaded()) {
          <div class="p-5 flex flex-col gap-4">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="flex flex-col gap-1.5 animate-pulse">
                <div class="h-3.5 bg-gray-100 rounded w-3/4"></div>
                <div class="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            }
          </div>

        } @else if (totalCount() === 0) {
          <div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <svg class="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24"
              stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <div>
              <p class="text-sm font-semibold text-gray-500">No saved phrases yet</p>
              <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                Save sentences from the<br>subtitle learner or translator.
              </p>
            </div>
            <div class="flex flex-col gap-1.5 mt-1">
              <a routerLink="/subtitles" class="text-xs font-semibold text-red-500 hover:underline">
                Go to Subtitle Learner →
              </a>
              <a routerLink="/translate" class="text-xs font-semibold text-blue-600 hover:underline">
                Go to Translator →
              </a>
            </div>
          </div>

        } @else if (filteredCount() === 0) {
          <div class="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <p class="text-sm font-semibold text-gray-500">No matches</p>
            <p class="text-xs text-gray-400">Try a different search term.</p>
          </div>

        } @else {
          @for (group of grouped(); track group.lang) {

            <!-- Language group header -->
            <div class="sticky top-0 z-10 px-4 py-1.5 bg-gray-50 border-b border-gray-100
                        flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">{{ group.lang }}</span>
              <span class="text-[11px] text-gray-400">{{ group.phrases.length }}</span>
            </div>

            @for (phrase of group.phrases; track phrase.id) {
              <div
                (click)="select(phrase)"
                class="flex items-start gap-2 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors"
                [class]="selected()?.id === phrase.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-50'">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate leading-snug mb-0.5">
                    {{ phrase.phrase }}
                  </p>
                  @if (phrase.translation) {
                    <p class="text-xs text-gray-400 truncate">{{ phrase.translation }}</p>
                  }
                </div>
                <!-- Source badge -->
                <span class="shrink-0 mt-0.5"
                  [class]="phrase.source === 'subtitle'
                    ? 'text-[10px] font-bold px-1.5 py-0.5 rounded border bg-red-50 text-red-500 border-red-100'
                    : 'text-[10px] font-bold px-1.5 py-0.5 rounded border bg-blue-50 text-blue-500 border-blue-100'">
                  {{ phrase.source === 'subtitle' ? '▶ Sub' : '⇄ Trans' }}
                </span>
              </div>
            }

          }
        }

      </div>
    </div>

    <!-- ── Right panel: phrase detail ── -->
    <div class="flex-1 overflow-y-auto bg-[#f8f9ff]">

      @if (!selected()) {
        <div class="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
          <div class="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm
                      flex items-center justify-center">
            <svg class="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24"
              stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <p class="text-base font-semibold text-gray-500">Select a phrase to review it</p>
            <p class="text-sm text-gray-400 mt-1">Click any phrase from the list to see its detail.</p>
          </div>
        </div>

      } @else {
        <div class="max-w-xl mx-auto p-8 flex flex-col gap-5">

          <!-- Source badge + language -->
          <div class="flex items-center gap-2">
            @if (selected()!.source === 'subtitle') {
              <span class="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg
                           bg-red-50 text-red-500 border border-red-100">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Subtitle Learner
              </span>
            } @else {
              <span class="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg
                           bg-blue-50 text-blue-600 border border-blue-100">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Translator
              </span>
            }
            <span class="text-xs text-gray-400">{{ selected()!.language }}</span>
          </div>

          <!-- Phrase text -->
          <div class="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Phrase</p>
            <p class="text-xl font-semibold text-gray-900 leading-snug">{{ selected()!.phrase }}</p>
          </div>

          <!-- Translation -->
          @if (selected()!.translation) {
            <div class="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col gap-1.5">
              <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Translation</p>
              <p class="text-base text-gray-800">{{ selected()!.translation }}</p>
              @if (selected()!.transliteration) {
                <p class="text-sm text-gray-400 italic">{{ selected()!.transliteration }}</p>
              }
            </div>
          }

          <!-- Video source (subtitle phrases only) -->
          @if (selected()!.source === 'subtitle' && selected()!.videoTitle) {
            <div class="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col gap-2">
              <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">From video</p>
              <div class="flex items-start justify-between gap-3">
                <p class="text-sm text-gray-700 font-medium leading-snug">{{ selected()!.videoTitle }}</p>
                @if (selected()!.videoId) {
                  <a [href]="'https://youtu.be/' + selected()!.videoId" target="_blank"
                    class="shrink-0 flex items-center gap-1 text-xs font-medium text-red-500
                           hover:underline">
                    Watch
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                }
              </div>
            </div>
          }

          <!-- Remove -->
          <div class="pt-2 border-t border-gray-200">
            <button
              (click)="remove(selected()!)"
              class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                     text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Remove phrase
            </button>
          </div>

        </div>
      }

    </div>
  `,
})
export class GlossaryComponent {
  protected readonly svc = inject(PhrasesService);

  readonly search  = signal('');
  readonly selected = signal<SavedPhrase | null>(null);

  readonly grouped = computed(() => {
    const q = this.search().trim().toLowerCase();
    const phrases = this.svc.phrases();
    const filtered = q
      ? phrases.filter(p =>
          p.phrase.toLowerCase().includes(q) ||
          (p.translation ?? '').toLowerCase().includes(q)
        )
      : phrases;

    const map = new Map<string, SavedPhrase[]>();
    for (const p of filtered) {
      const lang = p.language || 'Unknown';
      if (!map.has(lang)) map.set(lang, []);
      map.get(lang)!.push(p);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([lang, phrases]) => ({ lang, phrases }));
  });

  readonly totalCount    = computed(() => this.svc.phrases().length);
  readonly filteredCount = computed(() => this.grouped().reduce((n, g) => n + g.phrases.length, 0));
  readonly groupCount    = computed(() => new Set(this.svc.phrases().map(p => p.language || 'Unknown')).size);

  select(phrase: SavedPhrase): void { this.selected.set(phrase); }

  remove(phrase: SavedPhrase): void {
    if (this.selected()?.id === phrase.id) this.selected.set(null);
    this.svc.removePhrase(phrase.id);
  }
}
