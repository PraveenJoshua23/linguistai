import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService } from '../translator/translate.service';
import { TranslationResult } from '../../shared/models/translation.model';
import { LANGUAGE_NAMES } from '../../shared/languages';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { environment } from '../../../environments/environment';

interface HistoryEntry {
  id: string;
  source_text: string;
  source_lang: string;
  target_lang: string;
  result_json: TranslationResult;
  created_at: string;
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="flex flex-col gap-6 p-6">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <h1 class="text-lg font-bold text-gray-800">Translation History</h1>
        <div class="flex items-center gap-2">
          <input type="search" placeholder="Search translations…" aria-label="Search translations"
            [value]="q()" (input)="onSearch($any($event.target).value)"
            class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-56" />
          <select aria-label="Filter by language" [value]="lang()"
            (change)="lang.set($any($event.target).value); reload()"
            class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All languages</option>
            @for (l of languages; track l) { <option [value]="l">{{ l }}</option> }
          </select>
        </div>
      </div>

      @if (loading() && entries().length === 0) {
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
          @if (loadError()) {
            <p class="text-lg font-medium">Couldn't load history</p>
            <button (click)="reload()" class="text-sm text-blue-600 hover:underline">Try again</button>
          } @else if (q() || lang()) {
            <p class="text-lg font-medium">No matches</p>
            <p class="text-sm">Try a different search or language.</p>
          } @else {
            <p class="text-lg font-medium">No history yet</p>
            <p class="text-sm">Translations you make will appear here.</p>
          }
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (entry of entries(); track entry.id) {
            <div
              (click)="reuse(entry)"
              class="group bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">{{ entry.source_text }}</p>
                  <p class="text-sm text-blue-600 truncate">{{ entry.result_json.translation }}</p>
                  @if (entry.result_json.transliteration) {
                    <p class="text-xs text-gray-400 italic">{{ entry.result_json.transliteration }}</p>
                  }
                </div>
                <div class="flex items-start gap-3 shrink-0">
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-[10px] text-gray-400">
                      {{ entry.source_lang === 'auto' ? 'Auto' : entry.source_lang }} → {{ entry.target_lang }}
                    </span>
                    <span class="text-[10px] text-gray-400">
                      {{ entry.created_at | date:'d MMM, h:mm a' }}
                    </span>
                  </div>
                  <button (click)="remove(entry, $event)" title="Delete" aria-label="Delete translation"
                    class="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          }
          @if (hasMore()) {
            <button (click)="loadMore()" [disabled]="loading()"
              class="self-center px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50">
              {{ loading() ? 'Loading…' : 'Load more' }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class HistoryComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly translateSvc = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly languages = LANGUAGE_NAMES;
  readonly entries = signal<HistoryEntry[]>([]);
  readonly loading = signal(true);
  readonly hasMore = signal(false);
  readonly loadError = signal(false);
  readonly q = signal('');
  readonly lang = signal('');
  private page = 0;
  private searchTimer?: ReturnType<typeof setTimeout>;
  private requestSeq = 0;

  ngOnInit(): void {
    this.reload();
  }

  onSearch(value: string): void {
    this.q.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reload(), 300);
  }

  reload(): void {
    this.page = 0;
    this.entries.set([]);
    this.fetch();
  }

  loadMore(): void {
    this.page++;
    this.fetch();
  }

  private fetch(): void {
    const seq = ++this.requestSeq; // ignore responses to superseded searches
    const params: Record<string, string> = { limit: String(PAGE_SIZE), page: String(this.page) };
    if (this.q().trim()) params['q'] = this.q().trim();
    if (this.lang()) params['lang'] = this.lang();

    this.loading.set(true);
    this.loadError.set(false);
    this.http.get<HistoryEntry[]>(`${environment.apiBase}/history`, { params })
      .subscribe({
        next: (data) => {
          if (seq !== this.requestSeq) return;
          this.entries.update(e => [...e, ...data]);
          this.hasMore.set(data.length === PAGE_SIZE);
          this.loading.set(false);
        },
        error: () => {
          if (seq !== this.requestSeq) return;
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  remove(entry: HistoryEntry, event: Event): void {
    event.stopPropagation();
    const before = this.entries();
    this.entries.update(e => e.filter(x => x.id !== entry.id));
    this.http.delete(`${environment.apiBase}/history/${entry.id}`).subscribe({
      error: () => {
        this.entries.set(before);
        this.toast.error("Couldn't delete that translation. Please try again.");
      },
    });
  }

  reuse(entry: HistoryEntry): void {
    this.translateSvc.sourceText.set(entry.source_text);
    this.translateSvc.sourceLang.set(entry.source_lang);
    this.translateSvc.targetLang.set(entry.target_lang);
    // id lets a breakdown fetched from here be saved back onto this row.
    this.translateSvc.setResult({ ...entry.result_json, id: entry.id });
    this.router.navigate(['/translate']);
  }
}
