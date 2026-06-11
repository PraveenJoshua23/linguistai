import { Component, inject } from '@angular/core';
import { TranslateService } from '../translate.service';

const CONTEXTS = ['General', 'Business', 'Casual', 'Legal', 'Medical', 'Travel', 'Academic'];

@Component({
  selector: 'app-context-bar',
  standalone: true,
  imports: [],
  template: `
    <div class="flex items-center gap-4 flex-wrap">
      <!-- Context dropdown -->
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-500">Context</label>
        <select
          [value]="svc.context()"
          (change)="svc.context.set($any($event.target).value)"
          class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
          @for (ctx of contexts; track ctx) {
            <option [value]="ctx">{{ ctx }}</option>
          }
        </select>
      </div>

      <!-- Tone toggle -->
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-500">Tone</label>
        <div class="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
          <button
            (click)="svc.tone.set('Formal')"
            [class]="svc.tone() === 'Formal' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'"
            class="px-4 py-1.5 text-sm transition-colors">
            Formal
          </button>
          <button
            (click)="svc.tone.set('Informal')"
            [class]="svc.tone() === 'Informal' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'"
            class="px-4 py-1.5 text-sm transition-colors border-l border-gray-200">
            Informal
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ContextBarComponent {
  protected readonly svc = inject(TranslateService);
  protected readonly contexts = CONTEXTS;
}
