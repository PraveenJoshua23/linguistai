import { Injectable, signal } from '@angular/core';

/** One error message at a time, auto-hidden. Rendered by the shell. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  error(message: string): void {
    this.message.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), 5000);
  }
}
