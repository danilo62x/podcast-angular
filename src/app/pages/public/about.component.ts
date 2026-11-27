import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { AdSlotPillComponent } from '@app/components/pc/status-pill.component';
import { HOSTS, SHOW, pcImage } from '@app/core/data/mock';
import {
  averageCompletion,
  publishedEpisodes,
  totalDownloads,
  totalUniqueListeners,
} from '@app/core/data/query';
import { PodcastService } from '@app/core/services/podcast.service';
import { usePageTitle } from '@app/core/page-title';
import { formatCompact, formatNumber, formatPercent } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

const FAQ_KEYS = ['1', '2', '3', '4', '5', '6'];

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [TranslocoModule, IconComponent, AdSlotPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *transloco="let t">
      <!-- ---- Sobre o programa ---- -->
      <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div class="min-w-0">
            <p class="text-xs font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">
              {{ t('about.eyebrow') }}
            </p>
            <h1 class="mt-2 text-title-sm font-bold text-heading">{{ t('about.title') }}</h1>
            <p class="mt-3 text-base text-muted">{{ t('about.subtitle') }}</p>
            <p class="mt-6 text-sm leading-relaxed text-body">{{ t('about.showText1') }}</p>
            <p class="mt-4 text-sm leading-relaxed text-body">{{ t('about.showText2') }}</p>

            <dl class="mt-8 grid gap-4 sm:grid-cols-2">
              <div class="surface-card rounded-xl border p-4">
                <dt class="text-xs text-muted">{{ t('settings.show.category') }}</dt>
                <dd class="mt-1 text-sm font-semibold text-heading">
                  {{ show.category }} · {{ show.subcategory }}
                </dd>
              </div>
              <div class="surface-card rounded-xl border p-4">
                <dt class="text-xs text-muted">{{ t('settings.show.email') }}</dt>
                <dd class="mt-1 text-sm font-semibold break-all text-heading">{{ show.email }}</dd>
              </div>
            </dl>
          </div>

          <div class="min-w-0">
            <img
              [src]="cover()"
              [alt]="show.name"
              class="aspect-square w-full rounded-2xl object-cover shadow-theme-md"
            />
          </div>
        </div>
      </section>

      <!-- ---- Apresentadores ---- -->
      <section class="border-y border-themed bg-gray-50/60 py-12 dark:bg-gray-900/40">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header class="max-w-2xl">
            <h2 class="text-title-sm font-bold text-heading">{{ t('about.hostsTitle') }}</h2>
            <p class="mt-2 text-sm text-muted">{{ t('about.hostsSubtitle') }}</p>
          </header>
          <div class="mt-8 grid gap-5 sm:grid-cols-2">
            @for (host of hosts; track host.id) {
              <article class="surface-card flex gap-4 rounded-2xl border p-5">
                <img [src]="host.avatar" [alt]="host.name" class="h-16 w-16 shrink-0 rounded-full object-cover" />
                <div class="min-w-0">
                  <h3 class="text-base font-semibold text-heading">{{ host.name }}</h3>
                  <p class="text-sm text-brand-600 dark:text-brand-400">{{ host.role }}</p>
                  <p class="mt-2 text-sm text-muted">{{ host.bio }}</p>
                </div>
              </article>
            }
          </div>
        </div>
      </section>

      <!-- ---- Patrocínio / mídia kit ---- -->
      <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header class="max-w-2xl">
          <h2 class="text-title-sm font-bold text-heading">{{ t('about.sponsorTitle') }}</h2>
          <p class="mt-2 text-sm text-muted">{{ t('about.sponsorSubtitle') }}</p>
        </header>

        <dl class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (row of kitRows(); track row.key) {
            <div class="surface-card rounded-2xl border p-5">
              <span
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15"
              >
                <app-icon [name]="row.icon" [size]="20" />
              </span>
              <dt class="mt-4 text-xs text-muted">{{ t('about.kit.' + row.key) }}</dt>
              <dd class="mt-1 text-title-sm font-bold text-heading">{{ row.value }}</dd>
            </div>
          }
        </dl>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          @for (sponsor of podcast.sponsors(); track sponsor.id) {
            <span
              class="surface-card inline-flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-sm"
            >
              <img [src]="logo(sponsor.logoSeed)" alt="" class="h-7 w-7 rounded-full object-cover" />
              <span class="font-medium text-body">{{ sponsor.name }}</span>
              <app-ad-slot-pill [slot]="sponsor.slot" />
            </span>
          }
        </div>

        <a
          [href]="'mailto:' + show.email"
          class="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <app-icon name="mail" [size]="16" />
          {{ t('about.kit.cta') }}
        </a>
      </section>

      <!-- ---- FAQ ---- -->
      <section class="border-t border-themed py-12">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header class="text-center">
            <h2 class="text-title-sm font-bold text-heading">{{ t('about.faqTitle') }}</h2>
            <p class="mt-2 text-sm text-muted">{{ t('about.faqSubtitle') }}</p>
          </header>

          <div class="mt-8 space-y-3">
            @for (key of faqKeys; track key) {
              <div class="surface-card overflow-hidden rounded-xl border">
                <button
                  type="button"
                  (click)="open.set(open() === key ? null : key)"
                  [attr.aria-expanded]="open() === key"
                  class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span class="min-w-0 text-sm font-medium text-heading">{{ t('about.faq.q' + key) }}</span>
                  <app-icon
                    name="chevron-down"
                    [size]="18"
                    [class]="'shrink-0 text-muted transition-transform ' + (open() === key ? 'rotate-180' : '')"
                  />
                </button>
                @if (open() === key) {
                  <p class="border-t border-themed px-5 py-4 text-sm leading-relaxed text-muted">
                    {{ t('about.faq.a' + key) }}
                  </p>
                }
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
})
export class AboutPageComponent {
  podcast = inject(PodcastService);
  private lang = activeLang();

  protected readonly hosts = HOSTS;
  protected readonly show = SHOW;
  protected readonly faqKeys = FAQ_KEYS;
  protected readonly open = signal<string | null>('1');

  private readonly published = computed(() => publishedEpisodes(this.podcast.episodes()));

  protected readonly kitRows = computed(() => {
    const rows = this.published();
    const lang = this.lang();
    return [
      { key: 'downloads', value: formatCompact(totalDownloads(rows), lang), icon: 'download' },
      { key: 'listeners', value: formatCompact(totalUniqueListeners(rows), lang), icon: 'headphones' },
      { key: 'completion', value: formatPercent(averageCompletion(rows), lang), icon: 'activity' },
      { key: 'episodes', value: formatNumber(rows.length, lang), icon: 'mic' },
    ];
  });

  constructor() {
    usePageTitle('about.title');
  }

  protected cover() {
    return pcImage(SHOW.coverSeed, 640, 640);
  }
  protected logo(seed: string) {
    return pcImage(seed, 64, 64);
  }
}
