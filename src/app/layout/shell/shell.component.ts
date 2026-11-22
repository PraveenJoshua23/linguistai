import { Component, inject, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-[#f8f9ff]">
      <app-sidebar [collapsed]="collapsed()" (toggleCollapse)="toggleCollapse()" />
      <div class="flex flex-col flex-1 overflow-hidden">
        <main class="flex-1 min-h-0 flex flex-col overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
    @if (toast.message(); as msg) {
      <div role="alert"
        class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg bg-gray-900 text-white text-sm">
        {{ msg }}
        <button (click)="toast.message.set(null)" class="text-gray-400 hover:text-white" aria-label="Dismiss">✕</button>
      </div>
    }
  `,
})
export class ShellComponent {
  private readonly prefsSvc = inject(PreferencesService);
  protected readonly toast = inject(ToastService);
  readonly collapsed = signal(false);

  constructor() {
    // Apply saved sidebar preference once prefs load
    effect(() => {
      if (this.prefsSvc.loaded()) {
        this.collapsed.set(this.prefsSvc.prefs().sidebar_collapsed);
      }
    });
  }

  toggleCollapse(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    // Persist the toggle immediately
    this.prefsSvc.save({ sidebar_collapsed: next });
  }
}
