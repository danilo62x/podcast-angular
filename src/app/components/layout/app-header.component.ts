import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { LanguageSwitcherComponent } from '@app/components/ui/language-switcher.component';
import { AuthService } from '@app/core/services/auth.service';
import { UiService } from '@app/core/services/ui.service';

const NOTIFICATIONS = [
  { id: 1, key: 'episodeLive', name: 'Quando o time dobra de tamanho', timeKey: 'minutes12', read: false },
  { id: 2, key: 'feedError', name: 'Site', timeKey: 'hours2', read: false },
  { id: 3, key: 'sponsorEnding', name: 'Papelaria Traço', timeKey: 'yesterday', read: true },
];

@Component({
  selector: 'app-app-header',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent, LanguageSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="surface-header sticky top-0 z-30 flex w-full border-b" *transloco="let t">
      <div class="flex flex-grow items-center justify-between gap-4 px-4 py-3 md:px-6 2xl:px-10">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-lg border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800"
            (click)="onToggleSidebar()"
            [attr.aria-label]="t('appNav.collapse')"
          >
            <app-icon name="menu" [size]="20" />
          </button>

          <a
            routerLink="/app/episodios/novo"
            class="hidden h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex"
          >
            <app-icon name="plus" [size]="18" />
            {{ t('episodesAdmin.new') }}
          </a>
        </div>

        <div class="flex items-center gap-2">
          <a
            routerLink="/app/audiencia"
            class="hidden h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm text-muted transition hover:bg-gray-50 md:flex dark:hover:bg-gray-800"
          >
            <app-icon name="chart" [size]="16" />
            {{ t('appNav.audience') }}
          </a>
          <app-language-switcher />
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800"
            (click)="ui.toggleDarkMode()"
            [attr.aria-label]="t('common.theme')"
          >
            <app-icon [name]="ui.darkMode() ? 'sun' : 'moon'" [size]="18" />
          </button>

          <div class="relative" data-notif>
            <button
              type="button"
              class="relative flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800"
              [attr.aria-label]="t('appNav.notifications')"
              (click)="notifOpen.set(!notifOpen())"
            >
              <app-icon name="bell" [size]="18" />
              <span class="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75"></span>
                <span class="relative inline-flex h-2 w-2 rounded-full bg-error-500"></span>
              </span>
            </button>
            @if (notifOpen()) {
              <div
                class="surface-card absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl border shadow-theme-lg"
              >
                <div class="flex items-center justify-between border-b border-themed px-4 py-3">
                  <p class="text-sm font-semibold text-heading">{{ t('appNav.notifications') }}</p>
                </div>
                <ul class="max-h-72 divide-y divide-themed overflow-y-auto">
                  @for (n of notifications; track n.id) {
                    <li class="flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <span
                        [class]="
                          'mt-1 flex h-2 w-2 shrink-0 rounded-full ' + (n.read ? 'bg-gray-300' : 'bg-brand-500')
                        "
                      ></span>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-heading">
                          {{ t('notifications.' + n.key, { name: n.name }) }}
                        </p>
                        <p class="text-xs text-muted">{{ t('notifications.' + n.timeKey) }}</p>
                      </div>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>

          <div class="relative" data-dropdown>
            <button type="button" class="ml-1 flex items-center gap-3" (click)="dropdownOpen.set(!dropdownOpen())">
              <span class="hidden text-right lg:block">
                <span class="block text-sm font-medium text-heading">{{ auth.user()?.name || '—' }}</span>
                <span class="block text-xs text-muted">{{ auth.user()?.role || '—' }}</span>
              </span>
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 font-semibold text-white">
                {{ initials() }}
              </span>
              <app-icon name="chevron-down" [size]="16" class="text-muted" />
            </button>

            @if (dropdownOpen()) {
              <div class="surface-card absolute right-0 mt-3 w-56 rounded-xl border shadow-theme-lg">
                <div class="border-b border-themed px-4 py-3">
                  <p class="truncate text-sm font-medium text-heading">{{ auth.user()?.name || '—' }}</p>
                  <p class="truncate text-xs text-muted">{{ auth.user()?.email || '' }}</p>
                </div>
                <ul class="py-1">
                  <li>
                    <a
                      routerLink="/app/configuracoes"
                      class="flex items-center gap-2 px-4 py-2 text-sm text-body hover:bg-gray-50 dark:hover:bg-gray-800"
                      (click)="dropdownOpen.set(false)"
                    >
                      <app-icon name="settings" [size]="16" /> {{ t('appNav.settings') }}
                    </a>
                  </li>
                  <li>
                    <a
                      routerLink="/"
                      class="flex items-center gap-2 px-4 py-2 text-sm text-body hover:bg-gray-50 dark:hover:bg-gray-800"
                      (click)="dropdownOpen.set(false)"
                    >
                      <app-icon name="globe" [size]="16" /> {{ t('appNav.viewSite') }}
                    </a>
                  </li>
                </ul>
                <div class="border-t border-themed py-1">
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                    (click)="handleLogout()"
                  >
                    <app-icon name="logout" [size]="16" /> {{ t('appNav.logout') }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class AppHeaderComponent {
  ui = inject(UiService);
  auth = inject(AuthService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  protected readonly notifications = NOTIFICATIONS;
  protected readonly dropdownOpen = signal(false);
  protected readonly notifOpen = signal(false);

  protected readonly initials = computed(() => {
    const user = this.auth.user();
    if (!user) return '?';
    return user.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  });

  protected onToggleSidebar() {
    if (window.innerWidth < 1024) this.ui.toggleSidebarMobile();
    else this.ui.toggleSidebar();
  }

  protected handleLogout() {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const el = this.host.nativeElement as HTMLElement;
    const target = e.target as Node;
    const dropdown = el.querySelector('[data-dropdown]');
    const notif = el.querySelector('[data-notif]');
    if (dropdown && !dropdown.contains(target)) this.dropdownOpen.set(false);
    if (notif && !notif.contains(target)) this.notifOpen.set(false);
  }
}
