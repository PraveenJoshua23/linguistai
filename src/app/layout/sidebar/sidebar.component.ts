import { Component, input, output, inject, signal, HostListener } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { SupabaseService } from '../../core/auth/supabase.service';

interface NavItem {
  label: string;
  route: string;
  svgPath: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Translate',
    route: '/translate',
    svgPath:
      'm10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802',
  },
  {
    label: 'History',
    route: '/history',
    svgPath: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    label: 'Saved',
    route: '/saved',
    svgPath:
      'M17.593 3.322c1.1.128 1.907 1.032 1.907 2.277v14.401l-7.5-2.5-7.5 2.5V5.599c0-1.245.907-2.15 1.907-2.277a48.507 48.507 0 0 1 11.186 0Z',
  },
  {
    label: 'Glossary',
    route: '/glossary',
    svgPath:
      'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
  },
  {
    label: 'Flashcards',
    route: '/flashcards',
    svgPath:
      'M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3',
  },
  {
    label: 'Subtitles',
    route: '/subtitles',
    svgPath:
      'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v.125c0 .621.504 1.125 1.125 1.125h.375m-1.5-1.25V6.375a1.125 1.125 0 0 1 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125v12m-18 0h18',
  },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive],
  template: `
    <aside
      class="flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden"
      [class]="collapsed() ? 'w-16' : 'w-56'">

      <!-- Logo -->
      <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-100 overflow-hidden min-h-[72px]">
        <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
          </svg>
        </div>
        @if (!collapsed()) {
          <div class="overflow-hidden">
            <p class="font-bold text-gray-900 text-sm whitespace-nowrap">LinguistAI</p>
            <p class="text-xs text-gray-400 whitespace-nowrap">Pro Account</p>
          </div>
        }
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive
            #rla="routerLinkActive"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            [class.justify-center]="collapsed()"
            [ngClass]="rla.isActive
              ? 'bg-blue-50 text-blue-600 font-semibold'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.svgPath" />
            </svg>
            @if (!collapsed()) {
              <span class="text-sm whitespace-nowrap">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <!-- Footer: collapse toggle + user -->
      <div class="border-t border-gray-100">
        <button
          (click)="toggleCollapse.emit()"
          class="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          [class.justify-center]="collapsed()">
          <svg
            class="w-4 h-4 flex-shrink-0 transition-transform duration-300"
            [class.rotate-180]="collapsed()"
            fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          @if (!collapsed()) {
            <span class="text-xs whitespace-nowrap">Collapse</span>
          }
        </button>

        @if (supabase.currentUser()) {
          <div
            class="flex items-center gap-3 px-4 py-4 overflow-hidden relative"
            [class.justify-center]="collapsed()">

            <!-- Avatar — clickable only when collapsed to show popover -->
            <button
              (click)="collapsed() ? toggleMenu() : null"
              [class.cursor-default]="!collapsed()"
              class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold hover:ring-2 hover:ring-blue-300 transition-all">
              {{ initials() }}
            </button>

            <!-- Expanded: inline email + sign out -->
            @if (!collapsed()) {
              <div class="overflow-hidden flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ supabase.currentUser()?.email }}</p>
                <button (click)="signOut()" class="text-xs text-red-500 hover:underline whitespace-nowrap">
                  Sign out
                </button>
              </div>
            }

            <!-- Collapsed: popover menu -->
            @if (collapsed() && menuOpen()) {
              <div
                class="fixed bottom-16 left-16 z-[999] bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-48">
                <div class="px-3 py-2 border-b border-gray-100">
                  <p class="text-xs font-medium text-gray-900 truncate">{{ supabase.currentUser()?.email }}</p>
                </div>
                <button
                  (click)="signOut()"
                  class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  Sign out
                </button>
              </div>
            }

          </div>
        }
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly collapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();
  readonly navItems = NAV_ITEMS;
  readonly menuOpen = signal(false);

  protected readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuOpen.set(false);
  }

  toggleMenu(): void {
    // Stop the document click from immediately closing it
    setTimeout(() => this.menuOpen.update(v => !v));
  }

  initials(): string {
    const email = this.supabase.currentUser()?.email ?? '';
    return email.slice(0, 2).toUpperCase();
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
