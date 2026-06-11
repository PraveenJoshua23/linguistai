import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );

  readonly currentUser = signal<User | null>(null);
  readonly loading = signal(true);

  constructor() {
    this.client.auth.getSession().then(({ data }) => {
      this.currentUser.set(data.session?.user ?? null);
      this.loading.set(false);
    });

    this.client.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
  }

  async signUp(email: string, password: string) {
    return this.client.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return this.client.auth.signOut();
  }
}
