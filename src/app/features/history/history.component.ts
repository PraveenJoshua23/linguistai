import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService } from '../translator/translate.service';
import { SupabaseService } from '../../core/auth/supabase.service';
import { TranslationResult } from '../../shared/models/translation.model';
import { environment } from '../../../environments/environment';

interface HistoryEntry {
  id: string;
  source_text: string;
  source_lang: string;
  target_lang: string;
  result_json: TranslationResult;
  created_at: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="flex flex-col gap-6 p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-bold text-gray-800">Translation History</h1>
        @if (entries().length > 0) {
          <span class="text-xs text-gray-400">{{ entries().length }} translation{{ entries().length === 1 ? '' : 's' }}</span>
        }
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center h-48 text-gray-400">
          <svg class="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading history…
        </div>
      } @else if (entries().length === 0) {
        <div class="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
          <svg class="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p class="text-lg font-medium">No history yet</p>
          <p class="text-sm">Translations you make will appear here.</p>
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (entry of entries(); track entry.id) {
            <div
              (click)="reuse(entry)"
              class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">{{ entry.source_text }}</p>
                  <p class="text-sm text-blue-600 truncate">{{ entry.result_json.translation }}</p>
                  @if (entry.result_json.transliteration) {
                    <p class="text-xs text-gray-400 italic">{{ entry.result_json.transliteration }}</p>
                  }
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0">
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                    [class]="entry.result_json.accuracy === 'high' ? 'bg-green-50 text-green-600'
                           : entry.result_json.accuracy === 'medium' ? 'bg-yellow-50 text-yellow-600'
                           : 'bg-red-50 text-red-500'">
                    {{ entry.result_json.accuracy }}
                  </span>
                  <span class="text-[10px] text-gray-400">
                    {{ entry.source_lang }} → {{ entry.target_lang }}
                  </span>
                  <span class="text-[10px] text-gray-400">
                    {{ entry.created_at | date:'d MMM, h:mm a' }}
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class HistoryComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly translateSvc = inject(TranslateService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly entries = signal<HistoryEntry[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    this.http.get<HistoryEntry[]>(`${environment.apiBase}/history/${userId}`)
      .subscribe({
        next: (data) => { this.entries.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  reuse(entry: HistoryEntry): void {
    this.translateSvc.sourceText.set(entry.source_text);
    this.translateSvc.sourceLang.set(entry.source_lang);
    this.translateSvc.targetLang.set(entry.target_lang);
    this.translateSvc.result.set(entry.result_json);
    this.router.navigate(['/translate']);
  }
}
