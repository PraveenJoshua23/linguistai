import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface GrammarLanguageInfo {
  id: string;
  language: string;
  name: string;
  file: string;
  topicCount: number;
}

export interface GrammarExample {
  text: string;
  romanization: string;
  translation: string;
}

export interface GrammarExercise {
  prompt: string;
  promptTranslation: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  level: string;
  summary: string;
  explanation: string;
  examples: GrammarExample[];
  exercises: GrammarExercise[];
}

interface GrammarFile {
  id: string;
  language: string;
  name: string;
  topics: GrammarTopic[];
}

@Injectable({ providedIn: 'root' })
export class GrammarService {
  private readonly http = inject(HttpClient);

  /** Language manifest — loaded once on first visit. */
  readonly languages = signal<GrammarLanguageInfo[]>([]);
  /** Topic lists keyed by language id, loaded on demand. */
  readonly topicsByLang = signal<Record<string, GrammarTopic[]>>({});
  readonly loadingLang = signal<string | null>(null);

  private manifestRequested = false;

  loadManifest(): void {
    if (this.manifestRequested) return;
    this.manifestRequested = true;
    this.http.get<GrammarLanguageInfo[]>('/grammar/index.json').subscribe({
      next: (langs) => this.languages.set(langs),
      error: (e) => console.warn('Could not load grammar manifest:', e.message),
    });
  }

  ensureLanguageLoaded(langId: string): void {
    if (this.topicsByLang()[langId] || this.loadingLang() === langId) return;
    const info = this.languages().find(l => l.id === langId);
    if (!info) return;

    this.loadingLang.set(langId);
    this.http.get<GrammarFile>(`/grammar/${info.file}`).subscribe({
      next: (file) => {
        this.topicsByLang.update(map => ({ ...map, [langId]: file.topics }));
        this.loadingLang.set(null);
      },
      error: (e) => {
        console.warn(`Could not load grammar for "${langId}":`, e.message);
        this.loadingLang.set(null);
      },
    });
  }
}
