import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreferencesService, UserPreferences } from '../../core/preferences/preferences.service';
import { SupabaseService } from '../../core/auth/supabase.service';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian',
  'Portuguese', 'Dutch', 'Russian', 'Chinese', 'Japanese',
  'Korean', 'Arabic', 'Hindi', 'Turkish', 'Polish',
];

const CONTEXTS = ['General', 'Business', 'Casual', 'Legal', 'Medical', 'Travel', 'Academic'];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex flex-col gap-8 p-6 max-w-2xl">

      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-gray-900">Settings</h1>
        <p class="text-sm text-gray-400 mt-0.5">Manage your preferences and account</p>
      </div>

      <!-- Account -->
      <section class="flex flex-col gap-4">
        <h2 class="text-xs font-bold tracking-wider text-gray-400 uppercase border-b border-gray-100 pb-2">
          Account
        </h2>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Display Name</label>
            <input
              type="text"
              [(ngModel)]="draft.display_name"
              placeholder="Your name"
              class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              [value]="supabase.currentUser()?.email ?? ''"
              disabled
              class="w-full px-3 py-2.5 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
        </div>
      </section>

      <!-- Translation Defaults -->
      <section class="flex flex-col gap-4">
        <h2 class="text-xs font-bold tracking-wider text-gray-400 uppercase border-b border-gray-100 pb-2">
          Translation Defaults
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Default Source Language</label>
            <select [(ngModel)]="draft.source_lang"
              class="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              @for (lang of languages; track lang) {
                <option [value]="lang">{{ lang }}</option>
              }
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Default Target Language</label>
            <select [(ngModel)]="draft.target_lang"
              class="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              @for (lang of languages; track lang) {
                <option [value]="lang">{{ lang }}</option>
              }
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Default Context</label>
            <select [(ngModel)]="draft.default_context"
              class="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              @for (ctx of contexts; track ctx) {
                <option [value]="ctx">{{ ctx }}</option>
              }
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Default Tone</label>
            <div class="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
              <button
                type="button"
                (click)="draft.default_tone = 'Formal'"
                [class]="draft.default_tone === 'Formal'
                  ? 'flex-1 py-2.5 text-sm bg-blue-50 text-blue-600 font-semibold transition-colors'
                  : 'flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors'">
                Formal
              </button>
              <button
                type="button"
                (click)="draft.default_tone = 'Informal'"
                [class]="draft.default_tone === 'Informal'
                  ? 'flex-1 py-2.5 text-sm bg-blue-50 text-blue-600 font-semibold border-l border-gray-200 transition-colors'
                  : 'flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-50 border-l border-gray-200 transition-colors'">
                Informal
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Display -->
      <section class="flex flex-col gap-4">
        <h2 class="text-xs font-bold tracking-wider text-gray-400 uppercase border-b border-gray-100 pb-2">
          Display
        </h2>
        <div class="flex flex-col gap-3">
          @for (toggle of displayToggles; track toggle.key) {
            <div class="flex items-center justify-between py-1">
              <div>
                <p class="text-sm font-medium text-gray-700">{{ toggle.label }}</p>
                <p class="text-xs text-gray-400">{{ toggle.description }}</p>
              </div>
              <button
                type="button"
                (click)="toggleBool(toggle.key)"
                class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                [class]="draft[toggle.key] ? 'bg-blue-600' : 'bg-gray-200'">
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  [class.translate-x-5]="draft[toggle.key]">
                </span>
              </button>
            </div>
          }
        </div>
      </section>

      <!-- Flashcards -->
      <section class="flex flex-col gap-4">
        <h2 class="text-xs font-bold tracking-wider text-gray-400 uppercase border-b border-gray-100 pb-2">
          Flashcards
        </h2>
        <div class="flex flex-col gap-3">
          @for (toggle of flashcardToggles; track toggle.key) {
            <div class="flex items-center justify-between py-1">
              <div>
                <p class="text-sm font-medium text-gray-700">{{ toggle.label }}</p>
                <p class="text-xs text-gray-400">{{ toggle.description }}</p>
              </div>
              <button
                type="button"
                (click)="toggleBool(toggle.key)"
                class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                [class]="draft[toggle.key] ? 'bg-blue-600' : 'bg-gray-200'">
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  [class.translate-x-5]="draft[toggle.key]">
                </span>
              </button>
            </div>
          }
        </div>
      </section>

      <!-- Save button -->
      <div class="flex items-center gap-3 pt-2">
        <button
          (click)="save()"
          [disabled]="prefsSvc.saving()"
          class="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
          @if (prefsSvc.saving()) {
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Saving…
          } @else {
            Save Preferences
          }
        </button>
        @if (saved()) {
          <span class="text-sm text-green-600 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Saved!
          </span>
        }
      </div>

    </div>
  `,
})
export class SettingsComponent {
  protected readonly prefsSvc = inject(PreferencesService);
  protected readonly supabase = inject(SupabaseService);

  readonly languages = LANGUAGES;
  readonly contexts = CONTEXTS;
  readonly saved = signal(false);

  // Work on a mutable draft so changes only apply on Save
  draft: UserPreferences = { ...this.prefsSvc.prefs() };

  readonly displayToggles: Array<{ key: keyof UserPreferences; label: string; description: string }> = [
    {
      key: 'sidebar_collapsed',
      label: 'Sidebar collapsed by default',
      description: 'Start with the sidebar collapsed when you open the app',
    },
    {
      key: 'show_breakdown',
      label: 'Show word breakdown automatically',
      description: 'Display the word-by-word breakdown after every translation',
    },
    {
      key: 'show_transliteration',
      label: 'Show transliteration',
      description: 'Show romanised pronunciation below the translated text',
    },
  ];

  readonly flashcardToggles: Array<{ key: keyof UserPreferences; label: string; description: string }> = [
    {
      key: 'flashcard_shuffle',
      label: 'Shuffle cards',
      description: 'Randomise card order at the start of each session',
    },
    {
      key: 'flashcard_auto_advance',
      label: 'Auto-advance after rating',
      description: 'Automatically move to the next card after you rate one',
    },
  ];

  toggleBool(key: keyof UserPreferences): void {
    (this.draft as any)[key] = !(this.draft as any)[key];
  }

  save(): void {
    this.prefsSvc.save({ ...this.draft });
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }
}
