import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { PageHeaderComponent } from '@app/components/app/page-header.component';
import { ApexChartComponent } from '@app/components/ui/apex-chart.component';
import { EmptyStateComponent } from '@app/components/ui/empty-state.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { EpisodeCardComponent } from '@app/components/pc/episode-card.component';
import { KpiCardComponent } from '@app/components/pc/kpi-card.component';
import { CountdownBadgeComponent } from '@app/components/pc/status-pill.component';
import {
  averageCompletion,
  downloadsByDay,
  publishedEpisodes,
  scheduledEpisodes,
  topEpisodes,
  totalUniqueListeners,
} from '@app/core/data/query';
import { PodcastService } from '@app/core/services/podcast.service';
import { usePageTitle } from '@app/core/page-title';
import { formatCompact, formatDateTime, formatNumber, formatPercent } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

const DAYS = 30;

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoModule,
    PageHeaderComponent,
    ApexChartComponent,
    EmptyStateComponent,
    IconComponent,
    EpisodeCardComponent,
    KpiCardComponent,
    CountdownBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *transloco="let t">
      <app-page-header
        [title]="t('dashboard.title')"
        [subtitle]="t('dashboard.subtitle')"
        [hasAction]="false"
      />

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-kpi-card
          [title]="t('dashboard.kpi.monthDownloads')"
          [value]="compact(monthValue())"
          [hint]="t('dashboard.kpi.monthDownloadsHint')"
          icon="download"
          accent="brand"
          [trend]="monthDelta() >= 0 ? 'up' : 'down'"
          [trendValue]="pct(abs(monthDelta()))"
        />
        <app-kpi-card
          [title]="t('dashboard.kpi.listeners')"
          [value]="compact(listeners())"
          [hint]="t('dashboard.kpi.listenersHint')"
          icon="headphones"
          accent="info"
        />
        <app-kpi-card
          [title]="t('dashboard.kpi.completion')"
          [value]="pct(completion())"
          [hint]="t('dashboard.kpi.completionHint')"
          icon="activity"
          accent="success"
        />
        <app-kpi-card
          [title]="t('dashboard.kpi.subscribers')"
          [value]="num(subscribers())"
          [hint]="t('dashboard.kpi.subscribersHint')"
          icon="mail"
          accent="warning"
        />
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-3">
        <div class="surface-card rounded-2xl border p-5 xl:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-base font-semibold text-heading">{{ t('dashboard.charts.daily') }}</h2>
            <p class="text-xs text-muted">{{ t('dashboard.charts.dailyHint', { count: days }) }}</p>
          </div>
          <div class="mt-4">
            <app-apex-chart
              type="area"
              [height]="280"
              [series]="[{ name: t('dashboard.charts.dailySeries'), data: dailyValues() }]"
              [options]="{
                xaxis: { categories: dailyLabels(), tickAmount: 8 },
                fill: {
                  type: 'gradient',
                  gradient: { shadeIntensity: 0.4, opacityFrom: 0.4, opacityTo: 0.05 }
                }
              }"
            />
          </div>
        </div>

        <div class="surface-card rounded-2xl border p-5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-base font-semibold text-heading">{{ t('dashboard.charts.monthly') }}</h2>
            <p class="text-xs text-muted">{{ t('dashboard.charts.monthlyHint') }}</p>
          </div>
          <div class="mt-4">
            <app-apex-chart
              type="bar"
              [height]="280"
              [series]="[{ name: t('dashboard.charts.dailySeries'), data: monthlyValues() }]"
              [options]="{
                xaxis: { categories: monthlyLabels() },
                plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } }
              }"
            />
          </div>
        </div>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-2">
        <div class="surface-card rounded-2xl border p-5">
          <h2 class="text-base font-semibold text-heading">{{ t('dashboard.topEpisodes') }}</h2>
          <ul class="mt-4 space-y-4">
            @for (episode of top(); track episode.id) {
              <li>
                <div class="flex items-center justify-between gap-3 text-sm">
                  <a
                    [routerLink]="['/app/episodios', episode.id]"
                    class="min-w-0 truncate font-medium text-body hover:text-brand-600"
                  >
                    {{ episode.number }}. {{ episode.title }}
                  </a>
                  <span class="shrink-0 text-xs text-muted tabular-nums">{{ num(episode.downloads) }}</span>
                </div>
                <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    class="h-full rounded-full bg-brand-500"
                    [style.width.%]="(episode.downloads / maxTop()) * 100"
                  ></div>
                </div>
              </li>
            }
          </ul>
        </div>

        <div class="surface-card rounded-2xl border p-5">
          <h2 class="text-base font-semibold text-heading">{{ t('dashboard.upcoming') }}</h2>
          @if (upcoming().length === 0) {
            <app-empty-state icon="calendar-clock" [title]="t('dashboard.noUpcoming')">
              <a
                routerLink="/app/episodios"
                class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                {{ t('dashboard.scheduleOne') }}
              </a>
            </app-empty-state>
          } @else {
            <ul class="mt-4 space-y-3">
              @for (episode of upcoming(); track episode.id) {
                <li class="flex flex-col gap-3 rounded-xl border border-themed p-4 sm:flex-row sm:items-center">
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-medium text-brand-600 dark:text-brand-400">
                      {{ t('episode.seasonEpisode', { season: episode.season, number: episode.number }) }}
                    </p>
                    <p class="mt-0.5 truncate text-sm font-semibold text-heading">{{ episode.title }}</p>
                    <p class="mt-1 text-xs text-muted">
                      {{ episode.scheduledAt ? dateTime(episode.scheduledAt) : '—' }}
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    @if (episode.scheduledAt) {
                      <app-countdown-badge [scheduledAt]="episode.scheduledAt" />
                    }
                    <a
                      [routerLink]="['/app/episodios', episode.id]"
                      [title]="t('dashboard.openEpisode')"
                      class="flex h-9 w-9 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-brand-600"
                    >
                      <app-icon name="edit" [size]="15" />
                    </a>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      </div>

      <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        @for (episode of latestThree(); track episode.id) {
          <app-episode-card [episode]="episode" [showStatus]="true" />
        }
      </div>
    </div>
  `,
})
export class DashboardPageComponent {
  private podcast = inject(PodcastService);
  private lang = activeLang();

  protected readonly days = DAYS;
  protected abs = Math.abs;

  private readonly published = computed(() => publishedEpisodes(this.podcast.episodes()));
  private readonly daily = computed(() => downloadsByDay(this.published(), DAYS));

  protected readonly dailyValues = computed(() => this.daily().map((p) => p.value));
  protected readonly dailyLabels = computed(() => this.daily().map((p) => p.label));
  protected readonly monthlyValues = computed(() => this.podcast.monthlyDownloads().map((p) => p.value));
  protected readonly monthlyLabels = computed(() => this.podcast.monthlyDownloads().map((p) => p.label));

  protected readonly top = computed(() => topEpisodes(this.podcast.episodes(), 5));
  protected readonly upcoming = computed(() => scheduledEpisodes(this.podcast.episodes()));
  protected readonly latestThree = computed(() => this.published().slice(0, 3));
  protected readonly maxTop = computed(() => Math.max(1, ...this.top().map((e) => e.downloads)));

  protected readonly listeners = computed(() => totalUniqueListeners(this.published()));
  protected readonly completion = computed(() => averageCompletion(this.published()));

  protected readonly monthValue = computed(() => {
    const rows = this.podcast.monthlyDownloads();
    return rows.length ? rows[rows.length - 1].value : 0;
  });

  protected readonly monthDelta = computed(() => {
    const rows = this.podcast.monthlyDownloads();
    const previous = rows.length > 1 ? rows[rows.length - 2].value : 0;
    return previous ? (this.monthValue() - previous) / previous : 0;
  });

  protected readonly subscribers = computed(() => {
    const rows = this.podcast.monthlySubscribers();
    return rows.length ? rows[rows.length - 1].value : 0;
  });

  constructor() {
    usePageTitle('dashboard.title');
  }

  protected compact(v: number) {
    return formatCompact(v, this.lang());
  }
  protected num(v: number) {
    return formatNumber(v, this.lang());
  }
  protected pct(v: number) {
    return formatPercent(v, this.lang());
  }
  protected dateTime(iso: string) {
    return formatDateTime(iso, this.lang());
  }
}
