import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';

// Lazy page files from an old build are gone after a rebuild/deploy; reload to pick up the new ones.
const STALE_CHUNK = /dynamically imported module|Importing a module script failed/i;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withNavigationErrorHandler(({ error, url }) => {
        if (!STALE_CHUNK.test(String(error?.message ?? error))) return;
        // Reload once per URL so a genuinely missing file can't loop forever.
        // ponytail: flag lives for the tab session, so a second stale deploy on the same URL won't auto-reload; clear it on NavigationEnd if that bites.
        if (sessionStorage.getItem('chunk-reload') === url) return;
        sessionStorage.setItem('chunk-reload', url);
        location.assign(url);
      }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
