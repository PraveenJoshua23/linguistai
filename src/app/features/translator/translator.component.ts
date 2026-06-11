import { Component, inject } from '@angular/core';
import { ContextBarComponent } from './components/context-bar.component';
import { TranslationPanelComponent } from './components/translation-panel.component';
import { WordBreakdownComponent } from './components/word-breakdown.component';
import { CtaBannerComponent } from './components/cta-banner.component';
import { PreferencesService } from '../../core/preferences/preferences.service';

@Component({
  selector: 'app-translator',
  standalone: true,
  imports: [
    ContextBarComponent,
    TranslationPanelComponent,
    WordBreakdownComponent,
    CtaBannerComponent,
  ],
  template: `
    <div class="flex flex-col min-h-[calc(100vh-61px)] overflow-y-auto">
      <div class="flex flex-col flex-1 p-6 space-y-6">
        <app-context-bar />
        <app-translation-panel />
        @if (prefs.prefs().show_breakdown) {
          <app-word-breakdown />
        }
        <!-- <app-cta-banner /> -->
      </div>

      <footer class="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between mt-6">
        <p class="text-xs text-gray-400">LinguistAI | Precise translation powered by AI</p>
        <div class="flex items-center gap-4">
          <a href="#" class="text-xs text-gray-400 hover:text-gray-600 transition-colors">Help Center</a>
          <a href="#" class="text-xs text-gray-400 hover:text-gray-600 transition-colors">Feedback</a>
          <a href="#" class="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy</a>
          <a href="#" class="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  `,
})
export class TranslatorComponent {
  protected readonly prefs = inject(PreferencesService);
}
