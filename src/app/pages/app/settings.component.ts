import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '@app/components/app/page-header.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { SwitchToggleComponent } from '@app/components/ui/switch-toggle.component';
import { TabsComponent, type TabItem } from '@app/components/ui/tabs.component';
import { SHOW, pcImage } from '@app/core/data/mock';
import { totalSponsorRevenue } from '@app/core/data/query';
import { LANGUAGES } from '@app/core/transloco-loader';
import { AuthService } from '@app/core/services/auth.service';
import { PodcastService } from '@app/core/services/podcast.service';
import { UiService } from '@app/core/services/ui.service';
import { usePageTitle } from '@app/core/page-title';
import { formatCurrency } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

const CONTROL = 'focus-ring w-full rounded-lg border border-themed bg-transparent px-3 py-2.5 text-sm text-body';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    PageHeaderComponent,
    IconComponent,
    SwitchToggleComponent,
    TabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *transloco="let t">
      <app-page-header [title]="t('settings.title')" [subtitle]="t('settings.subtitle')" [hasAction]="false" />

      <div class="surface-card rounded-2xl border p-5">
        <app-tabs [tabs]="tabs()" [value]="tab()" (onChange)="tab.set($event)">
          @switch (tab()) {
            @case (0) {
              <!-- ---- Perfil ---- -->
              <div class="max-w-xl space-y-4">
                <p class="text-sm font-medium text-heading">{{ t('settings.profile.title') }}</p>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-heading" for="pf-name">
                    {{ t('settings.profile.name') }}
                  </label>
                  <input
                    id="pf-name"
                    [ngModel]="profileName()"
                    (ngModelChange)="profileName.set($event)"
                    [class]="control"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-heading" for="pf-email">
                    {{ t('settings.profile.email') }}
                  </label>
                  <input
                    id="pf-email"
                    type="email"
                    [ngModel]="profileEmail()"
                    (ngModelChange)="profileEmail.set($event)"
                    [class]="control"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-heading" for="pf-role">
                    {{ t('settings.profile.role') }}
                  </label>
                  <input
                    id="pf-role"
                    [ngModel]="profileRole()"
                    (ngModelChange)="profileRole.set($event)"
                    [class]="control"
                  />
                </div>
                <button
                  type="button"
                  (click)="saveProfile()"
                  class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
                >
                  <app-icon name="save" [size]="15" />
                  {{ t('common.save') }}
                </button>
              </div>
            }

            @case (1) {
              <!-- ---- Programa ---- -->
              <div class="grid gap-6 lg:grid-cols-[1fr_240px]">
                <div class="min-w-0 space-y-4">
                  <p class="text-sm font-medium text-heading">{{ t('settings.show.title') }}</p>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-1.5 block text-sm font-medium text-heading" for="sh-name">
                        {{ t('settings.show.name') }}
                      </label>
                      <input
                        id="sh-name"
                        [ngModel]="showName()"
                        (ngModelChange)="showName.set($event)"
                        [class]="control"
                      />
                    </div>
                    <div>
                      <label class="mb-1.5 block text-sm font-medium text-heading" for="sh-cat">
                        {{ t('settings.show.category') }}
                      </label>
                      <input
                        id="sh-cat"
                        [ngModel]="showCategory()"
                        (ngModelChange)="showCategory.set($event)"
                        [class]="control"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-heading" for="sh-tag">
                      {{ t('settings.show.tagline') }}
                    </label>
                    <input
                      id="sh-tag"
                      [ngModel]="showTagline()"
                      (ngModelChange)="showTagline.set($event)"
                      [class]="control"
                    />
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-1.5 block text-sm font-medium text-heading" for="sh-lang">
                        {{ t('settings.show.language') }}
                      </label>
                      <select
                        id="sh-lang"
                        [ngModel]="showLanguage()"
                        (ngModelChange)="showLanguage.set($event)"
                        [class]="control"
                      >
                        @for (l of languages; track l.code) {
                          <option [value]="l.code">{{ l.label }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="mb-1.5 block text-sm font-medium text-heading" for="sh-email">
                        {{ t('settings.show.email') }}
                      </label>
                      <input
                        id="sh-email"
                        type="email"
                        [ngModel]="showEmail()"
                        (ngModelChange)="showEmail.set($event)"
                        [class]="control"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-heading" for="sh-cover">
                      {{ t('settings.show.cover') }}
                    </label>
                    <input
                      id="sh-cover"
                      [ngModel]="showCoverSeed()"
                      (ngModelChange)="showCoverSeed.set($event)"
                      [class]="control"
                    />
                  </div>

                  <div class="flex items-start justify-between gap-4 rounded-xl border border-themed p-4">
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-heading">{{ t('settings.show.explicit') }}</p>
                      <p class="mt-0.5 text-xs text-muted">{{ t('settings.show.explicitHint') }}</p>
                    </div>
                    <app-switch-toggle [checked]="showExplicit()" (changed)="showExplicit.set($event)" />
                  </div>

                  <button
                    type="button"
                    (click)="saveShow()"
                    class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
                  >
                    <app-icon name="save" [size]="15" />
                    {{ t('common.save') }}
                  </button>
                </div>

                <div class="min-w-0">
                  <img
                    [src]="cover()"
                    [alt]="showName()"
                    class="aspect-square w-full rounded-2xl object-cover"
                  />
                </div>
              </div>
            }

            @case (2) {
              <!-- ---- Monetização ---- -->
              <div class="max-w-2xl space-y-4">
                <p class="text-sm font-medium text-heading">{{ t('settings.monetization.title') }}</p>

                <div class="flex items-start justify-between gap-4 rounded-xl border border-themed p-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-heading">{{ t('settings.monetization.ads') }}</p>
                    <p class="mt-0.5 text-xs text-muted">{{ t('settings.monetization.adsDesc') }}</p>
                  </div>
                  <app-switch-toggle [checked]="moneyAds()" (changed)="setMoney(moneyAds, $event)" />
                </div>
                <div class="flex items-start justify-between gap-4 rounded-xl border border-themed p-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-heading">{{ t('settings.monetization.dynamic') }}</p>
                    <p class="mt-0.5 text-xs text-muted">{{ t('settings.monetization.dynamicDesc') }}</p>
                  </div>
                  <app-switch-toggle [checked]="moneyDynamic()" (changed)="setMoney(moneyDynamic, $event)" />
                </div>
                <div class="flex items-start justify-between gap-4 rounded-xl border border-themed p-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-heading">{{ t('settings.monetization.supporters') }}</p>
                    <p class="mt-0.5 text-xs text-muted">{{ t('settings.monetization.supportersDesc') }}</p>
                  </div>
                  <app-switch-toggle
                    [checked]="moneySupporters()"
                    (changed)="setMoney(moneySupporters, $event)"
                  />
                </div>

                <div class="rounded-xl border border-themed p-4">
                  <label class="block text-sm font-medium text-heading" for="mn-cpm">
                    {{ t('settings.monetization.cpmFloor') }}
                  </label>
                  <div class="mt-3 flex items-center gap-3">
                    <input
                      id="mn-cpm"
                      type="range"
                      [min]="0"
                      [max]="150"
                      [step]="5"
                      [ngModel]="cpmFloor()"
                      (ngModelChange)="cpmFloor.set(+$event)"
                      class="h-1 min-w-0 flex-1 cursor-pointer"
                    />
                    <span class="w-24 shrink-0 text-right text-sm font-semibold text-heading">
                      {{ currency(cpmFloor()) }}
                    </span>
                  </div>
                </div>

                <div class="rounded-xl border border-themed p-4">
                  <p class="text-xs text-muted">{{ t('settings.monetization.estimated') }}</p>
                  <p class="mt-1 text-title-sm font-bold text-success-600">{{ currency(monthlyRevenue()) }}</p>
                </div>
              </div>
            }

            @default {
              <!-- ---- Aparência ---- -->
              <div class="max-w-2xl space-y-4">
                <div class="flex items-start justify-between gap-4 rounded-xl border border-themed p-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-heading">{{ t('settings.appearance.dark') }}</p>
                    <p class="mt-0.5 text-xs text-muted">{{ t('settings.appearance.darkDesc') }}</p>
                  </div>
                  <app-switch-toggle [checked]="ui.darkMode()" (changed)="setDark($event)" />
                </div>

                <div class="rounded-xl border border-themed p-4">
                  <label class="block text-sm font-medium text-heading" for="ap-lang">
                    {{ t('settings.appearance.language') }}
                  </label>
                  <select
                    id="ap-lang"
                    [ngModel]="lang()"
                    (ngModelChange)="changeLanguage($event)"
                    [class]="control + ' mt-2'"
                  >
                    @for (l of languages; track l.code) {
                      <option [value]="l.code">{{ l.flag }} {{ l.label }}</option>
                    }
                  </select>
                  <p class="mt-2 text-xs text-muted">{{ t('settings.appearance.languageHint') }}</p>
                </div>

                <div class="rounded-xl border border-dashed border-themed p-4">
                  <p class="text-sm font-medium text-heading">{{ t('settings.reset.title') }}</p>
                  <p class="mt-0.5 text-xs text-muted">{{ t('settings.reset.desc') }}</p>
                  <button
                    type="button"
                    (click)="resetData()"
                    class="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <app-icon name="refresh-cw" [size]="15" />
                    {{ t('settings.reset.action') }}
                  </button>
                </div>
              </div>
            }
          }
        </app-tabs>
      </div>
    </div>
  `,
})
export class SettingsPageComponent {
  ui = inject(UiService);
  private auth = inject(AuthService);
  private podcast = inject(PodcastService);
  private transloco = inject(TranslocoService);
  protected readonly lang = activeLang();

  protected readonly control = CONTROL;
  protected readonly languages = LANGUAGES;
  protected readonly tab = signal(0);

  protected readonly profileName = signal(this.auth.user()?.name ?? '');
  protected readonly profileEmail = signal(this.auth.user()?.email ?? '');
  protected readonly profileRole = signal(this.auth.user()?.role ?? '');

  protected readonly showName = signal(SHOW.name);
  protected readonly showTagline = signal(SHOW.tagline);
  protected readonly showCategory = signal(SHOW.category);
  protected readonly showLanguage = signal(SHOW.language);
  protected readonly showEmail = signal(SHOW.email);
  protected readonly showCoverSeed = signal(SHOW.coverSeed);
  protected readonly showExplicit = signal(SHOW.explicit);

  protected readonly moneyAds = signal(true);
  protected readonly moneyDynamic = signal(false);
  protected readonly moneySupporters = signal(true);
  protected readonly cpmFloor = signal(35);

  protected readonly monthlyRevenue = computed(() => totalSponsorRevenue(this.podcast.sponsors()) / 12);

  protected readonly tabs = computed<TabItem[]>(() => {
    this.lang();
    const t = (key: string) => this.transloco.translate(key);
    return [
      { label: t('settings.tabs.profile'), icon: 'user' },
      { label: t('settings.tabs.show'), icon: 'radio' },
      { label: t('settings.tabs.monetization'), icon: 'dollar' },
      { label: t('settings.tabs.appearance'), icon: 'sparkles' },
    ];
  });

  constructor() {
    usePageTitle('settings.title');
  }

  protected cover() {
    return pcImage(this.showCoverSeed() || 'capa-programa-onda', 480, 480);
  }

  protected currency(v: number) {
    return formatCurrency(v, this.lang());
  }

  protected saveProfile() {
    this.auth.updateProfile({
      name: this.profileName(),
      email: this.profileEmail(),
      role: this.profileRole(),
    });
    this.ui.notifySuccess(this.transloco.translate('settings.profile.saved'));
  }

  protected saveShow() {
    this.ui.notifySuccess(this.transloco.translate('settings.show.saved'));
  }

  protected setMoney(target: { set: (v: boolean) => void }, value: boolean) {
    target.set(value);
    this.ui.notifySuccess(this.transloco.translate('settings.saved'));
  }

  protected setDark(value: boolean) {
    this.ui.setDarkMode(value);
    this.ui.notifySuccess(this.transloco.translate('settings.saved'));
  }

  protected changeLanguage(code: string) {
    this.transloco.setActiveLang(code);
    try {
      localStorage.setItem('lang', code);
    } catch {}
  }

  protected resetData() {
    this.podcast.reset();
    this.ui.notifySuccess(this.transloco.translate('settings.reset.done'));
  }
}
