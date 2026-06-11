import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Wait until the initial session check is done before deciding
  return toObservable(supabase.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (supabase.currentUser()) {
        return true;
      }
      return router.createUrlTree(['/login']);
    }),
  );
};
