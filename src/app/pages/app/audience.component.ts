import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { PageHeaderComponent } from '@app/components/app/page-header.component';
import { ApexChartComponent } from '@app/components/ui/apex-chart.component';
import { EmptyStateComponent } from '@app/components/ui/empty-state.component';
import { CountryListComponent } from '@app/components/pc/country-list.component';
import { KpiCardComponent } from '@app/components/pc/kpi-card.component';
import { PlatformBarsComponent } from '@app/components/pc/platform-bars.component';
import { RetentionChartComponent } from '@app/components/pc/retention-chart.component';
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

@Component({
  selector: 'app-audience-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    PageHeaderComponent,
    ApexChartComponent,
    EmptyStateComponent,
    CountryListComponent,
    KpiCardComponent,
    PlatformBarsComponent,
    RetentionChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *transloco="let t">
      <app-page-header [title]="t('audience.title')" [subtitle]="t('audience.subtitle')" [hasAction]="false" />

      @if (published().length === 0) {
        <div class="surface-card rounded-2xl border">
          <app-empty-state
            icon="chart"
            [title]="t('audience.emptyTitle')"
            [description]="t('audience.emptyDesc')"
          />
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <app-kpi-card
            [title]="t('audience.kpi.downloads')"
            [value]="compact(downloads())"
            icon="download"
            accent="brand"
          />
          <app-kpi-card
            [title]="t('audience.kpi.listeners')"
            [value]="compact(listeners())"
            icon="headphones"
            accent="info"
          />
          <app-kpi-card
            [title]="t('audience.kpi.completion')"
            [value]="pct(completion())"
            icon="activity"
            accent="success"
          />
          <app-kpi-card
            [title]="t('audience.kpi.episodes')"
            [value]="num(published().length)"
            icon="mic"
            accent="warning"
          />
        </div>

        <div class="mt-6 surface-card rounded-2xl border p-5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-base font-semibold text-heading">{{ t('audience.byEpisode') }}</h2>
            <p class="text-xs text-muted">{{ t('audience.byEpisodeHint') }}</p>
          </div>
          <div class="mt-4">
            <app-apex-chart
              type="bar"
              [height]="360"
              [series]="[{ name: t('audience.downloads'), data: topValues() }]"
              [options]="{
                plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '65%' } },
                xaxis: { categories: topLabels() },
                yaxis: { labels: { maxWidth: 220 } }
              }"
            />
          </div>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-2">
          <div class="surface-card rounded-2xl border p-5">
            <h2 class="mb-5 text-base font-semibold text-heading">{{ t('audience.byPlatform') }}</h2>
            <app-platform-bars [stats]="podcast.platformStats()" />
          </div>
          <div class="surface-card rounded-2xl border p-5">
            <h2 class="mb-3 text-base font-semibold text-heading">{{ t('audience.byCountry') }}</h2>
            <app-country-list [stats]="podcast.countryStats()" />
          </div>
        </div>

        <div class="mt-6 surface-card rounded-2xl border p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <h2 class="text-base font-semibold text-heading">{{ t('audience.retention') }}</h2>
              <p class="mt-1 text-xs text-muted">{{ t('audience.retentionHint') }}</p>
            </div>
            <label class="flex shrink-0 items-center gap-2 text-sm text-muted">
              <span class="whitespace-nowrap">{{ t('audience.selectEpisode') }}</span>
              <select
                [ngModel]="selectedId()"
                (ngModelChange)="selectedId.set(+$event)"
                class="focus-ring max-w-[16rem] rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body"
              >
                @for (e of published(); track e.id) {
                  <option [value]="e.id">{{ e.number }}. {{ e.title }}</option>
                }
              </select>
            </label>
          </div>

          @if (selected(); as sel) {
            <div class="mt-6">
              <app-retention-chart [retention]="sel.retention" [durationSec]="sel.durationSec" />
            </div>
            <dl class="mt-6 grid gap-4 sm:grid-cols-3">
              <div class="rounded-xl border border-themed p-4">
                <dt class="text-xs text-muted">{{ t('audience.downloads') }}</dt>
                <dd class="mt-1 text-lg font-semibold text-heading">{{ num(sel.downloads) }}</dd>
              </div>
              <div class="rounded-xl border border-themed p-4">
                <dt class="text-xs text-muted">{{ t('audience.listeners') }}</dt>
                <dd class="mt-1 text-lg font-semibold text-heading">{{ num(sel.uniqueListeners) }}</dd>
              </div>
              <div class="rounded-xl border border-themed p-4">
                <dt class="text-xs text-muted">{{ t('audience.completion') }}</dt>
                <dd class="mt-1 text-lg font-semibold text-heading">{{ pct(sel.completionRate) }}</dd>
              </div>
            </dl>
          }
        </div>
      }
    </div>
  `,
})
export class AudiencePageComponent {
  podcast = inject(PodcastService);
  private lang = activeLang();

  protected readonly published = computed(() => publishedEpisodes(this.podcast.episodes()));

  private readonly byDownloads = computed(() =>
    this.published()
      .slice()
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 10)
  );

  protected readonly topValues = computed(() => this.byDownloads().map((e) => e.downloads));
  protected readonly topLabels = computed(() => this.byDownloads().map((e) => `${e.number}. ${e.title}`));

  protected readonly downloads = computed(() => totalDownloads(this.published()));
  protected readonly listeners = computed(() => totalUniqueListeners(this.published()));
  protected readonly completion = computed(() => averageCompletion(this.published()));

  protected readonly selectedId = signal<number | null>(null);
  protected readonly selected = computed(() =>
    this.published().find((e) => e.id === this.selectedId())
  );

  constructor() {
    usePageTitle('audience.title');
    effect(() => {
      const rows = this.published();
      const current = this.selectedId();
      if (current === null && rows.length) this.selectedId.set(rows[0].id);
      else if (current !== null && !rows.some((e) => e.id === current)) {
        this.selectedId.set(rows[0]?.id ?? null);
      }
    });
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
}
