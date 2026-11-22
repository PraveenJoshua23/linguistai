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
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent),
      },
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
          import('./features/saved/saved-page.component').then(m => m.SavedPageComponent),
      },
      { path: 'glossary', redirectTo: '/saved?tab=phrases' },
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
