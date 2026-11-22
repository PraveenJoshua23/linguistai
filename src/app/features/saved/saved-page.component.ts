import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SavedComponent } from './saved.component';
import { GlossaryComponent } from '../glossary/glossary.component';
import { FlashcardsService } from '../flashcards/flashcards.service';
import { PhrasesService } from '../glossary/phrases.service';

/** One "Saved" page: Words (flashcards) and Phrases tabs. Tab lives in ?tab= so links and back work. */
@Component({
  selector: 'app-saved-page',
  standalone: true,
  imports: [RouterLink, SavedComponent, GlossaryComponent],
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`],
  template: `
    <nav class="flex gap-1 px-4 pt-3 border-b border-gray-100 bg-white" role="tablist">
      @for (t of tabs; track t.id) {
        <a [routerLink]="[]" [queryParams]="{ tab: t.id }" role="tab"
          [attr.aria-selected]="tab() === t.id"
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
          [class]="tab() === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'">
          {{ t.label }}
          <span class="ml-1 text-xs text-gray-400">{{ t.id === 'words' ? words.cards().length : phrases.phrases().length }}</span>
        </a>
      }
    </nav>
    <div class="flex flex-1 min-h-0">
      @if (tab() === 'phrases') { <app-glossary /> } @else { <app-saved /> }
    </div>
  `,
})
export class SavedPageComponent {
  protected readonly words = inject(FlashcardsService);
  protected readonly phrases = inject(PhrasesService);
  protected readonly tabs = [{ id: 'words', label: 'Words' }, { id: 'phrases', label: 'Phrases' }];
  protected readonly tab = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map(p => (p.get('tab') === 'phrases' ? 'phrases' : 'words'))),
    { initialValue: 'words' },
  );
}
