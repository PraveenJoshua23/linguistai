import { Component, computed, input, signal } from '@angular/core';
import { WordClass, WordEntry } from '../../../shared/models/word.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

const BADGE_CLASSES: Record<WordClass, string> = {
  NOUN: 'bg-blue-100 text-blue-700',
  VERB: 'bg-purple-100 text-purple-700',
  ADJ: 'bg-orange-100 text-orange-700',
  ADV: 'bg-green-100 text-green-700',
  PREP: 'bg-gray-100 text-gray-600',
  CONJ: 'bg-yellow-100 text-yellow-700',
};

@Component({
  selector: 'app-word-card',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">

      <!-- Header: word + badge + actions -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-lg font-bold text-gray-900">{{ word().word }}</h3>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded {{ badgeClass() }}">
              {{ word().wordClass }}
            </span>
          </div>
          <p class="text-xs text-gray-400 italic">{{ word().phonetic }}</p>
        </div>

        <div class="flex items-center gap-0.5 flex-shrink-0">
          <app-button variant="ghost" [iconOnly]="true" size="sm" (clicked)="toggleSaved()">
            <svg
              class="w-4 h-4 transition-colors"
              [class]="saved() ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'"
              viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          </app-button>
          <app-button variant="ghost" [iconOnly]="true" size="sm">
            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          </app-button>
          <app-button variant="ghost" [iconOnly]="true" size="sm">
            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.032 1.907 2.277v14.401l-7.5-2.5-7.5 2.5V5.599c0-1.245.907-2.15 1.907-2.277.64-.074 1.28-.135 1.927-.184" />
            </svg>
          </app-button>
        </div>
      </div>

      <!-- Definition -->
      <p class="text-sm text-gray-600 leading-relaxed">{{ word().definition }}</p>

      <!-- Example usage toggle -->
      <button
        (click)="showExamples.set(!showExamples())"
        class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-blue-600 tracking-wider uppercase transition-colors w-fit">
        <svg
          class="w-3.5 h-3.5 transition-transform duration-200"
          [class.rotate-180]="showExamples()"
          fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
        Example Usage
      </button>

      @if (showExamples()) {
        <div class="flex flex-col gap-1.5 pl-3 border-l-2 border-blue-100">
          @for (example of word().examples; track $index) {
            <p class="text-xs text-gray-500 italic">"{{ example }}"</p>
          }
        </div>
      }
    </div>
  `,
})
export class WordCardComponent {
  readonly word = input.required<WordEntry>();

  readonly saved = signal(false);
  readonly showExamples = signal(false);

  readonly badgeClass = computed(() => BADGE_CLASSES[this.word().wordClass]);

  toggleSaved(): void {
    this.saved.set(!this.saved());
  }
}
