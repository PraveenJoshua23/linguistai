import { Component, input, output, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { SupabaseService } from '../../core/auth/supabase.service';
import { StudyLanguageService } from '../../shared/study-language.service';

interface NavItem {
  label: string;
  route: string;
  svgPath: string;
  dueBadge?: boolean;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Learn',
    items: [
      { label: 'Home', route: '/home', svgPath: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
      {
        label: 'Translate', route: '/translate',
        svgPath: 'm10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802',
      },
      { label: 'Subtitles', route: '/subtitles', svgPath: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM6 15h5M13 15h5' },
      { label: 'Grammar', route: '/grammar', svgPath: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5' },
    ],
  },
  {
    title: 'Review',
    items: [
      { label: 'Flashcards', route: '/flashcards', dueBadge: true, svgPath: 'M7 4h12a1 1 0 0 1 1 1v12M4 8h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z' },
    ],
  },
  {
    title: 'Library',
    items: [
      { label: 'Saved', route: '/saved', svgPath: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z' },
      { label: 'Glossary', route: '/glossary', svgPath: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' },
      { label: 'History', route: '/history', svgPath: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    ],
  },
];

const SETTINGS_ICON = 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex-shrink-0 px-3 py-5 gap-5"
      [class]="collapsed() ? 'w-16' : 'w-60'">

      <!-- Logo -->
      <div class="flex items-center gap-2.5 px-1.5 overflow-hidden" [class.justify-center]="collapsed()">
        <div class="w-8 h-8 rounded-[9px] bg-blue-600 flex items-center justify-center flex-shrink-0">
          <svg aria-hidden="true" class="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="groups[0].items[1].svgPath" />
          </svg>
        </div>
        @if (!collapsed()) {
          <span class="font-bold text-[15px] tracking-tight text-slate-900 whitespace-nowrap">LinguistAI</span>
        }
      </div>

      <!-- Language switcher -->
      <div class="relative flex flex-col gap-1.5">
        @if (!collapsed()) {
          <span class="text-[11px] font-semibold tracking-wider uppercase text-slate-500 px-1.5">Studying</span>
        }
        <button (click)="toggleLangMenu()" [attr.aria-expanded]="langMenuOpen()"
          [attr.aria-label]="collapsed() ? 'Studying ' + study.current().name + '. Switch language' : null"
          class="flex items-center gap-2.5 w-full min-h-[52px] p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-left"
          [class.justify-center]="collapsed()">
          <span class="w-[34px] h-[34px] rounded-lg bg-blue-50 text-blue-700 font-bold text-xs uppercase flex items-center justify-center flex-shrink-0">{{ study.current().code }}</span>
          @if (!collapsed()) {
            <span class="flex-1 flex flex-col min-w-0">
              <span class="font-semibold text-sm text-slate-900 truncate">{{ study.current().name }}</span>
              <span [attr.lang]="study.current().code" class="text-xs text-slate-600 truncate">{{ study.current().native }}</span>
            </span>
            <svg aria-hidden="true" class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 9 4-4 4 4M16 15l-4 4-4-4"/></svg>
          }
        </button>

        @if (langMenuOpen()) {
          <div class="absolute top-full mt-1 z-50 w-56 border border-slate-200 rounded-xl bg-white p-1.5 flex flex-col gap-0.5 shadow-xl"
            [class.left-0]="!collapsed()" [class.left-12]="collapsed()">
            @for (l of study.languages(); track l.name) {
              <button (click)="pick(l.name)"
                class="flex items-center gap-2.5 min-h-11 px-2 rounded-lg text-left text-sm hover:bg-slate-100"
                [class.bg-blue-50]="l.name === study.current().name">
                <span class="w-7 h-7 rounded-[7px] bg-slate-100 text-slate-700 font-bold text-[11px] uppercase flex items-center justify-center">{{ l.code }}</span>
                <span class="flex-1 text-slate-900">{{ l.name }} <span [attr.lang]="l.code" class="text-slate-600">· {{ l.native }}</span></span>
                @if (l.due) {
                  <span class="text-[11px] font-semibold text-blue-700 bg-blue-50 rounded-full px-1.5 py-0.5">{{ l.due }}</span>
                }
              </button>
            }
            <a routerLink="/settings" (click)="langMenuOpen.set(false)"
              class="flex items-center gap-2.5 min-h-11 px-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-slate-100">
              <svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Add a language
            </a>
          </div>
        }
      </div>

      <!-- Navigation -->
      <nav aria-label="Main" class="flex-1 flex flex-col gap-3.5 overflow-y-auto">
        @for (g of groups; track g.title) {
          <div class="flex flex-col gap-0.5">
            @if (!collapsed()) {
              <span class="text-[11px] font-semibold tracking-wider uppercase text-slate-500 px-2.5 pb-1">{{ g.title }}</span>
            }
            @for (item of g.items; track item.route) {
              <a [routerLink]="item.route" routerLinkActive #rla="routerLinkActive"
                [attr.aria-label]="collapsed() ? item.label : null" [attr.title]="collapsed() ? item.label : null"
                class="relative flex items-center gap-2.5 min-h-10 px-2.5 rounded-[9px] text-sm transition-colors"
                [class.justify-center]="collapsed()"
                [class]="rla.isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100 font-medium'">
                <svg aria-hidden="true" class="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.svgPath" />
                </svg>
                @if (!collapsed()) {
                  <span class="flex-1 whitespace-nowrap">{{ item.label }}</span>
                }
                @if (item.dueBadge && study.totalDue()) {
                  <span class="text-[11px] font-bold text-white bg-blue-600 rounded-full px-1.5 py-0.5"
                    [class.absolute]="collapsed()" [class.-top-1]="collapsed()" [class.-right-1]="collapsed()">{{ study.totalDue() }}</span>
                }
              </a>
            }
          </div>
        }
      </nav>

      <!-- Footer -->
      <div class="border-t border-slate-200 pt-3 flex flex-col gap-1">
        <button (click)="toggleCollapse.emit()" [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          class="flex items-center gap-2.5 min-h-9 px-2.5 rounded-[9px] text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          [class.justify-center]="collapsed()">
          <svg aria-hidden="true" class="w-4 h-4 flex-shrink-0 transition-transform duration-300" [class.rotate-180]="collapsed()"
            fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          @if (!collapsed()) { <span class="text-xs">Collapse</span> }
        </button>

        @if (supabase.currentUser()) {
          <div class="relative flex items-center gap-2.5 px-1.5 pt-1" [class.justify-center]="collapsed()" [class.flex-col]="collapsed()">
            <button (click)="collapsed() ? toggleMenu() : null" [attr.aria-label]="collapsed() ? 'Account menu' : null"
              [class.cursor-default]="!collapsed()"
              class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              {{ initials() }}
            </button>
            @if (!collapsed()) {
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-semibold text-slate-900 truncate">{{ supabase.currentUser()?.email }}</p>
                <button (click)="signOut()" class="text-xs text-red-600 hover:underline">Sign out</button>
              </div>
            }
            <a routerLink="/settings" routerLinkActive="text-blue-700 bg-blue-50" aria-label="Settings" title="Settings"
              class="w-10 h-10 rounded-[9px] flex items-center justify-center text-slate-600 hover:bg-slate-100 flex-shrink-0">
              <svg aria-hidden="true" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="settingsIcon" />
              </svg>
            </a>

            @if (collapsed() && menuOpen()) {
              <div class="fixed bottom-16 left-16 z-[999] bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-48">
                <div class="px-3 py-2 border-b border-slate-100">
                  <p class="text-xs font-medium text-slate-900 truncate">{{ supabase.currentUser()?.email }}</p>
                </div>
                <button (click)="signOut()" class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">Sign out</button>
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
  readonly groups = NAV_GROUPS;
  readonly settingsIcon = SETTINGS_ICON;
  readonly menuOpen = signal(false);
  readonly langMenuOpen = signal(false);

  protected readonly supabase = inject(SupabaseService);
  protected readonly study = inject(StudyLanguageService);
  private readonly router = inject(Router);

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuOpen.set(false);
    this.langMenuOpen.set(false);
  }

  // setTimeout: let the document click close other menus before this one opens.
  toggleMenu(): void {
    setTimeout(() => this.menuOpen.update(v => !v));
  }

  toggleLangMenu(): void {
    setTimeout(() => this.langMenuOpen.update(v => !v));
  }

  pick(name: string): void {
    this.study.select(name);
    this.langMenuOpen.set(false);
  }

  initials(): string {
    return (this.supabase.currentUser()?.email ?? '').slice(0, 2).toUpperCase();
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
