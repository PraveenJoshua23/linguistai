import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

/** Attaches the Supabase access token to requests for our own API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBase)) return next(req);

  const supabase = inject(SupabaseService);
  // getSession() refreshes the token first if it has expired.
  return from(supabase.client.auth.getSession()).pipe(
    switchMap(({ data }) => {
      const token = data.session?.access_token;
      return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
    }),
  );
};
