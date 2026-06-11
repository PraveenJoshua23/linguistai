import { Component, inject } from '@angular/core';
import { TranslateService } from '../translate.service';
import { FlashcardsService } from '../../flashcards/flashcards.service';

@Component({
  selector: 'app-word-breakdown',
  standalone: true,
  template: `
    @if (svc.breakdown().length > 0) {
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-gray-700 flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            Word-by-Word Breakdown
          </h2>
          <span class="text-xs text-gray-400">{{ svc.breakdown().length }} words</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (word of svc.breakdown(); track word.word) {
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-base font-bold text-gray-900">{{ word.word }}</span>
                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {{ word.pos }}
                  </span>
                </div>
                <!-- Add to Flashcards button -->
                <button
                  (click)="toggleFlashcard(word)"
                  [title]="flashcards.isAdded(word.word, svc.targetLang()) ? 'Remove from flashcards' : 'Add to flashcards'"
                  class="shrink-0 p-1 rounded-lg transition-colors"
                  [class]="flashcards.isAdded(word.word, svc.targetLang())
                    ? 'text-purple-500 bg-purple-50 hover:bg-purple-100'
                    : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
                  </svg>
                </button>
              </div>
              <p class="text-xs font-medium text-gray-500">{{ word.meaning }}</p>
              <p class="text-xs text-gray-600 leading-relaxed">{{ word.explanation }}</p>
              @if (word.examples.length > 0) {
                <ul class="mt-1 flex flex-col gap-1">
                  @for (ex of word.examples; track ex) {
                    <li class="text-xs text-gray-400 italic">"{{ ex }}"</li>
                  }
                </ul>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class WordBreakdownComponent {
  protected readonly svc = inject(TranslateService);
  protected readonly flashcards = inject(FlashcardsService);

  toggleFlashcard(word: any): void {
    if (this.flashcards.isAdded(word.word, this.svc.targetLang())) {
      const card = this.flashcards.cards().find(
        c => c.word === word.word && c.language === this.svc.targetLang()
      );
      if (card) this.flashcards.removeCard(card.id);
    } else {
      this.flashcards.addWord(word, this.svc.targetLang());
    }
  }
}
