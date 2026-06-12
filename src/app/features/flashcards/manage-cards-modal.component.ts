import { Component, computed, inject, output, signal } from '@angular/core';
import { FlashcardsService } from './flashcards.service';
import { DecksService } from './decks.service';

const NEW_DECK = '__new__';
const NO_DECK = '';

interface CardRow {
  id: string;
  word: string;
  meaning: string;
  language: string;
  deckId: string | null;
}

@Component({
  selector: 'app-manage-cards-modal',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" (click)="closed.emit()">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        (click)="$event.stopPropagation()">

        <div class="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 class="text-lg font-bold text-gray-900">Organize Cards</h2>
            <p class="text-xs text-gray-400 mt-0.5">Select cards and move them into a deck.</p>
          </div>
          <button (click)="closed.emit()" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        @if (rows().length === 0) {
          <div class="px-6 pb-6 text-sm text-gray-400 text-center">
            You don't have any cards of your own yet.
          </div>
        } @else {
          <!-- Select-all + scrollable card list grouped by language -->
          <div class="px-6 flex items-center justify-between pb-2">
            <button (click)="toggleAll()" class="text-xs font-semibold text-blue-600 hover:text-blue-700">
              {{ allSelected() ? 'Clear selection' : 'Select all' }}
            </button>
            <span class="text-xs text-gray-400">{{ selectedCount() }} selected</span>
          </div>

          <div class="flex-1 overflow-y-auto px-6 flex flex-col gap-4 min-h-0">
            @for (group of groups(); track group.language) {
              <div class="flex flex-col gap-1.5">
                <p class="text-xs font-bold tracking-wider text-gray-400 uppercase sticky top-0 bg-white py-1">
                  {{ group.language }}
                </p>
                @for (card of group.cards; track card.id) {
                  <label class="flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors"
                    [class]="selected().has(card.id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-100 hover:bg-gray-50'">
                    <input type="checkbox" [checked]="selected().has(card.id)"
                      (change)="toggle(card.id)"
                      class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400" />
                    <span class="flex-1 min-w-0">
                      <span class="text-sm font-semibold text-gray-900">{{ card.word }}</span>
                      <span class="text-sm text-gray-400 ml-2">{{ card.meaning }}</span>
                    </span>
                    @if (deckName(card.deckId); as name) {
                      <span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[11px] font-semibold shrink-0">
                        {{ name }}
                      </span>
                    }
                  </label>
                }
              </div>
            }
          </div>

          <!-- Footer: choose target deck + move -->
          <div class="border-t border-gray-100 p-6 pt-4 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold tracking-wider text-gray-400 uppercase shrink-0">Move to</span>
              <select (change)="target.set($any($event.target).value)"
                class="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400">
                <option [value]="noDeck" [selected]="target() === noDeck">No deck (My Cards)</option>
                @for (deck of decks(); track deck.id) {
                  <option [value]="deck.id" [selected]="target() === deck.id">{{ deck.name }}</option>
                }
                <option [value]="newDeck" [selected]="target() === newDeck">＋ New deck…</option>
              </select>
            </div>

            @if (target() === newDeck) {
              <input type="text" [value]="newName()" (input)="newName.set($any($event.target).value)"
                placeholder="New deck name (e.g. Travel Phrases)"
                class="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400" />
            }

            <div class="flex gap-3">
              <button (click)="closed.emit()"
                class="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                Done
              </button>
              <button (click)="move()" [disabled]="!canMove() || busy()"
                class="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {{ busy() ? 'Moving…' : 'Move ' + selectedCount() + ' card' + (selectedCount() === 1 ? '' : 's') }}
              </button>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class ManageCardsModalComponent {
  private readonly flashcardsSvc = inject(FlashcardsService);
  private readonly decksSvc = inject(DecksService);

  readonly closed = output<void>();

  readonly decks = this.decksSvc.decks;
  readonly noDeck = NO_DECK;
  readonly newDeck = NEW_DECK;

  readonly selected = signal<Set<string>>(new Set());
  readonly target = signal<string>(NO_DECK);
  readonly newName = signal('');
  readonly busy = signal(false);

  readonly rows = computed<CardRow[]>(() =>
    this.flashcardsSvc.cards().map(c => ({
      id: c.id, word: c.word, meaning: c.meaning, language: c.language, deckId: c.deckId,
    }))
  );

  readonly groups = computed(() => {
    const byLang = new Map<string, CardRow[]>();
    for (const card of this.rows()) {
      const list = byLang.get(card.language) ?? [];
      list.push(card);
      byLang.set(card.language, list);
    }
    return [...byLang.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([language, cards]) => ({ language, cards }));
  });

  readonly selectedCount = computed(() => this.selected().size);
  readonly allSelected = computed(() =>
    this.rows().length > 0 && this.selected().size === this.rows().length
  );

  readonly canMove = computed(() =>
    this.selectedCount() > 0 &&
    (this.target() !== NEW_DECK || this.newName().trim().length > 0)
  );

  deckName(deckId: string | null): string | null {
    if (!deckId) return null;
    return this.decks().find(d => d.id === deckId)?.name ?? null;
  }

  toggle(id: string): void {
    this.selected.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  toggleAll(): void {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.rows().map(c => c.id)));
  }

  async move(): Promise<void> {
    if (!this.canMove() || this.busy()) return;
    const cardIds = [...this.selected()];

    let deckId: string | null;
    if (this.target() === NO_DECK) {
      deckId = null;
    } else if (this.target() === NEW_DECK) {
      this.busy.set(true);
      const deck = await this.decksSvc.createDeck(this.newName().trim());
      this.busy.set(false);
      if (!deck) return;
      deckId = deck.id;
    } else {
      deckId = this.target();
    }

    this.flashcardsSvc.assignToDeck(cardIds, deckId);

    // Reset selection so the updated deck badges are visible; keep the modal
    // open for further organizing.
    this.selected.set(new Set());
    this.target.set(NO_DECK);
    this.newName.set('');
  }
}
