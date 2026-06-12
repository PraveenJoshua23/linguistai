import { Component, inject, output, signal } from '@angular/core';
import { FlashcardsService } from './flashcards.service';
import { LANGUAGES } from '../translator/translate.service';
import { WordPos } from '../../shared/models/translation.model';

const POS_OPTIONS: { value: WordPos; label: string }[] = [
  { value: 'NOUN', label: 'Noun' },
  { value: 'VERB', label: 'Verb' },
  { value: 'ADJ', label: 'Adjective' },
  { value: 'ADV', label: 'Adverb' },
  { value: 'PRON', label: 'Pronoun' },
  { value: 'PREP', label: 'Preposition' },
  { value: 'CONJ', label: 'Conjunction' },
  { value: 'DET', label: 'Determiner' },
  { value: 'INTJ', label: 'Interjection' },
];

@Component({
  selector: 'app-create-card-modal',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" (click)="closed.emit()">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4"
        (click)="$event.stopPropagation()">

        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-900">Create Flashcard</h2>
            <p class="text-xs text-gray-400 mt-0.5">Add your own word — it joins your review rotation immediately.</p>
          </div>
          <button (click)="closed.emit()" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Word *</span>
            <input type="text" [value]="word()" (input)="word.set($any($event.target).value)"
              placeholder="e.g. 사과"
              class="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Language *</span>
            <select (change)="language.set($any($event.target).value)"
              class="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400">
              @for (lang of languages; track lang) {
                <option [value]="lang" [selected]="lang === language()">{{ lang }}</option>
              }
            </select>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Meaning *</span>
            <input type="text" [value]="meaning()" (input)="meaning.set($any($event.target).value)"
              placeholder="e.g. apple"
              class="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Part of Speech</span>
            <select (change)="pos.set($any($event.target).value)"
              class="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400">
              @for (opt of posOptions; track opt.value) {
                <option [value]="opt.value" [selected]="opt.value === pos()">{{ opt.label }}</option>
              }
            </select>
          </label>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Notes <span class="normal-case font-normal">(optional)</span></span>
          <textarea rows="2" [value]="explanation()" (input)="explanation.set($any($event.target).value)"
            placeholder="Pronunciation, usage tips, mnemonics…"
            class="px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-blue-400"></textarea>
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Example Sentences <span class="normal-case font-normal">(optional, one per line)</span></span>
          <textarea rows="3" [value]="examplesText()" (input)="examplesText.set($any($event.target).value)"
            placeholder="사과를 먹어요. — I eat an apple."
            class="px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-blue-400"></textarea>
        </label>

        @if (error()) {
          <p class="text-sm text-red-500">{{ error() }}</p>
        }

        <div class="flex gap-3 pt-1">
          <button (click)="closed.emit()"
            class="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button (click)="save()"
            [disabled]="!canSave()"
            class="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Add Card
          </button>
        </div>

      </div>
    </div>
  `,
})
export class CreateCardModalComponent {
  private readonly flashcardsSvc = inject(FlashcardsService);

  readonly closed = output<void>();
  readonly created = output<void>();

  readonly languages = LANGUAGES;
  readonly posOptions = POS_OPTIONS;

  readonly word = signal('');
  readonly language = signal('Korean');
  readonly meaning = signal('');
  readonly pos = signal<string>('NOUN');
  readonly explanation = signal('');
  readonly examplesText = signal('');
  readonly error = signal<string | null>(null);

  canSave(): boolean {
    return this.word().trim().length > 0 && this.meaning().trim().length > 0;
  }

  save(): void {
    if (!this.canSave()) return;

    const examples = this.examplesText()
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const ok = this.flashcardsSvc.createCard({
      word: this.word().trim(),
      language: this.language(),
      meaning: this.meaning().trim(),
      explanation: this.explanation().trim(),
      examples,
      pos: this.pos(),
    });

    if (!ok) {
      this.error.set(`"${this.word().trim()}" is already in your ${this.language()} flashcards.`);
      return;
    }
    this.created.emit();
    this.closed.emit();
  }
}
