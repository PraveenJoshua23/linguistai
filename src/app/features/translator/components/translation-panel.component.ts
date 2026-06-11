import { Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { TranslateService } from '../translate.service';
import { PreferencesService } from '../../../core/preferences/preferences.service';
import { PhrasesService } from '../../glossary/phrases.service';

@Component({
  selector: 'app-translation-panel',
  standalone: true,
  imports: [ButtonComponent, TitleCasePipe],
  template: `
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

      <!-- Language selector row -->
      <div class="flex items-center border-b border-gray-100">
        <!-- Source language -->
        <div class="flex-1 flex items-center gap-2 px-4 py-3">
          <select
            (change)="svc.sourceLang.set($any($event.target).value)"
            class="text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none cursor-pointer">
            @for (lang of svc.languages; track lang) {
              <option [value]="lang" [selected]="lang === svc.sourceLang()">{{ lang }}</option>
            }
          </select>
        </div>

        <!-- Swap button -->
        <button
          (click)="svc.swapLanguages()"
          class="p-2 mx-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </button>

        <!-- Target language -->
        <div class="flex-1 flex items-center gap-2 px-4 py-3 justify-end">
          <select
            (change)="svc.targetLang.set($any($event.target).value)"
            class="text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none cursor-pointer">
            @for (lang of svc.languages; track lang) {
              <option [value]="lang" [selected]="lang === svc.targetLang()">{{ lang }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Textarea row -->
      <div class="flex">
        <!-- Source textarea -->
        <div class="flex-1 flex flex-col p-4 gap-3">
          <textarea
            [value]="svc.sourceText()"
            (input)="svc.sourceText.set($any($event.target).value)"
            (keydown)="onKeyDown($event)"
            placeholder="Enter text to translate..."
            rows="5"
            maxlength="2000"
            class="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed">
          </textarea>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">{{ svc.sourceText().length }} / 2000</span>
            <app-button
              variant="primary"
              size="sm"
              [disabled]="svc.loading() || !svc.sourceText().trim()"
              (clicked)="svc.translate()">
              @if (svc.loading()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Translating…
              } @else {
                Translate
              }
            </app-button>
          </div>
        </div>

        <div class="w-px bg-gray-100"></div>

        <!-- Target textarea -->
        <div class="flex-1 flex flex-col p-4 gap-3 bg-gray-50/50">
          <div class="flex-1 flex flex-col gap-1">
            @if (svc.translation()) {
              <p class="text-sm text-gray-800 leading-relaxed">{{ svc.translation() }}</p>
              @if (svc.transliteration() && prefs.prefs().show_transliteration) {
                <p class="text-xs text-gray-400 italic">{{ svc.transliteration() }}</p>
              }
            } @else {
              <p class="text-sm text-gray-400">Translation will appear here...</p>
            }
          </div>
          <div class="flex items-center justify-between min-h-[28px]">
            @if (svc.error()) {
              <span class="text-xs text-red-500">{{ svc.error() }}</span>
            } @else if (svc.accuracy()) {
              <div class="flex items-center gap-1.5 text-xs"
                [class]="svc.accuracy() === 'high' ? 'text-green-600' : svc.accuracy() === 'medium' ? 'text-yellow-600' : 'text-red-500'">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                {{ svc.accuracy() | titlecase }} translation accuracy
              </div>
            } @else {
              <span></span>
            }
            @if (svc.translation()) {
              <div class="flex items-center gap-0.5">
                <!-- Copy -->
                <app-button variant="ghost" [iconOnly]="true" size="sm" (clicked)="copy()">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.032 1.907 2.277v14.401l-7.5-2.5-7.5 2.5V5.599c0-1.245.907-2.15 1.907-2.277.64-.074 1.28-.135 1.927-.184" />
                  </svg>
                </app-button>
                <!-- Save phrase -->
                <button
                  (click)="savePhrase()"
                  [title]="phraseSvc.isSaved(svc.sourceText(), svc.sourceLang()) ? 'Phrase saved' : 'Save phrase'"
                  class="p-1.5 rounded-lg transition-colors"
                  [class]="phraseSvc.isSaved(svc.sourceText(), svc.sourceLang())
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'">
                  @if (phraseSvc.isSaved(svc.sourceText(), svc.sourceLang())) {
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.593 3.322c1.1.128 1.907 1.032 1.907 2.277v14.401l-7.5-2.5-7.5 2.5V5.599c0-1.245.907-2.15 1.907-2.277a48.507 48.507 0 0 1 11.186 0Z" />
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.032 1.907 2.277v14.401l-7.5-2.5-7.5 2.5V5.599c0-1.245.907-2.15 1.907-2.277a48.507 48.507 0 0 1 11.186 0Z" />
                    </svg>
                  }
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TranslationPanelComponent {
  protected readonly svc = inject(TranslateService);
  protected readonly prefs = inject(PreferencesService);
  protected readonly phraseSvc = inject(PhrasesService);

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.svc.loading() && this.svc.sourceText().trim()) {
        this.svc.translate();
      }
    }
  }

  copy(): void {
    navigator.clipboard.writeText(this.svc.translation());
  }

  savePhrase(): void {
    this.phraseSvc.savePhrase({
      phrase: this.svc.sourceText().trim(),
      language: this.svc.sourceLang(),
      translation: this.svc.translation(),
      transliteration: this.svc.transliteration() ?? undefined,
      source: 'translator',
    });
  }
}
