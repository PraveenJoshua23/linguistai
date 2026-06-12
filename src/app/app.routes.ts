import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'translate', pathMatch: 'full' },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'translate',
        loadComponent: () =>
          import('./features/translator/translator.component').then(m => m.TranslatorComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history.component').then(m => m.HistoryComponent),
      },
      {
        path: 'saved',
        loadComponent: () =>
          import('./features/saved/saved.component').then(m => m.SavedComponent),
      },
      {
        path: 'glossary',
        loadComponent: () =>
          import('./features/glossary/glossary.component').then(m => m.GlossaryComponent),
      },
      {
        path: 'flashcards',
        loadComponent: () =>
          import('./features/flashcards/flashcards.component').then(m => m.FlashcardsComponent),
      },
      {
        path: 'grammar',
        loadComponent: () =>
          import('./features/grammar/grammar.component').then(m => m.GrammarComponent),
      },
      {
        path: 'subtitles',
        loadComponent: () =>
          import('./features/subtitles/subtitles.component').then(m => m.SubtitlesComponent),
      },
    ],
  },
];
