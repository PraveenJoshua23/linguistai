import { Component, inject, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopNavComponent } from '../top-nav/top-nav.component';
import { PreferencesService } from '../../core/preferences/preferences.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopNavComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-[#f8f9ff]">
      <app-sidebar [collapsed]="collapsed()" (toggleCollapse)="toggleCollapse()" />
      <div class="flex flex-col flex-1 overflow-hidden">
        <app-top-nav />
        <main class="flex-1 min-h-0 flex flex-col overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  private readonly prefsSvc = inject(PreferencesService);
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
