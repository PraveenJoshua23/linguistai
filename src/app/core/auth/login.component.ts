import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">

        <!-- Logo -->
        <div class="flex flex-col items-center gap-3 mb-8">
          <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
            </svg>
          </div>
          <div class="text-center">
            <h1 class="text-xl font-bold text-gray-900">LinguistAI</h1>
            <p class="text-sm text-gray-500 mt-0.5">
              {{ mode() === 'signin' ? 'Sign in to your account' : 'Create your account' }}
            </p>
          </div>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">

          @if (error()) {
            <div class="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
              {{ error() }}
            </div>
          }

          @if (successMsg()) {
            <div class="bg-green-50 border border-green-100 text-green-600 text-sm rounded-lg px-4 py-3">
              {{ successMsg() }}
            </div>
          }

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              placeholder="you@example.com"
              class="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              placeholder="••••••••"
              (keydown.enter)="submit()"
              class="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
          </div>

          <button
            (click)="submit()"
            [disabled]="loading()"
            class="mt-1 w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            @if (loading()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            }
            {{ mode() === 'signin' ? 'Sign in' : 'Create account' }}
          </button>

          <p class="text-center text-sm text-gray-500">
            {{ mode() === 'signin' ? "Don't have an account?" : 'Already have an account?' }}
            <button
              (click)="toggleMode()"
              class="text-blue-600 font-semibold hover:underline ml-1">
              {{ mode() === 'signin' ? 'Sign up' : 'Sign in' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly mode = signal<'signin' | 'signup'>('signin');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  email = '';
  password = '';

  toggleMode(): void {
    this.mode.update(m => m === 'signin' ? 'signup' : 'signin');
    this.error.set(null);
    this.successMsg.set(null);
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.successMsg.set(null);

    if (!this.email || !this.password) {
      this.error.set('Please enter your email and password.');
      return;
    }

    this.loading.set(true);

    if (this.mode() === 'signup') {
      const { error } = await this.supabase.signUp(this.email, this.password);
      this.loading.set(false);
      if (error) {
        this.error.set(error.message);
      } else {
        this.successMsg.set('Account created! Check your email to confirm, then sign in.');
        this.mode.set('signin');
      }
    } else {
      const { error } = await this.supabase.signIn(this.email, this.password);
      this.loading.set(false);
      if (error) {
        this.error.set(error.message);
      } else {
        this.router.navigate(['/translate']);
      }
    }
  }
}
