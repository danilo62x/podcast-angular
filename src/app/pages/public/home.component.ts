import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { EpisodeCardComponent } from '@app/components/pc/episode-card.component';
import { PlayButtonComponent } from '@app/components/pc/play-button.component';
import { WaveformComponent } from '@app/components/pc/waveform.component';
import { PLATFORM_ICON } from '@app/components/pc/platform-bars.component';
import { HOSTS, pcImage } from '@app/core/data/mock';
import { episodesOfSeason, latestEpisode, publishedEpisodes } from '@app/core/data/query';
import type { PlatformName } from '@app/core/data/types';
import { PlayerService } from '@app/core/services/player.service';
import { PodcastService } from '@app/core/services/podcast.service';
import { UiService } from '@app/core/services/ui.service';
import { usePageTitle } from '@app/core/page-title';
import { formatDate, formatDurationLong, formatNumber } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslocoModule,
    IconComponent,
    EpisodeCardComponent,
    PlayButtonComponent,
    WaveformComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *transloco="let t">
      <!-- ---- Hero com o último episódio ---- -->
      @if (latest(); as latestEp) {
        <section class="relative overflow-hidden border-b border-themed">
          <div class="absolute inset-0 -z-10">
            <img [src]="img(latestEp.coverSeed, 1600, 900)" alt="" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"></div>
          </div>

          <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div class="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div class="min-w-0">
                <p
                  class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur"
                >
                  <app-icon name="mic" [size]="13" />
                  {{ t('home.hero.eyebrow') }} · {{ t('home.hero.badge', { count: published().length }) }}
                </p>
                <p class="mt-5 text-sm font-semibold text-brand-300">
                  {{ t('episode.seasonEpisode', { season: latestEp.season, number: latestEp.number }) }}
                </p>
                <h1 class="mt-2 text-3xl font-bold text-white sm:text-title-md lg:text-title-lg">
                  {{ latestEp.title }}
                </h1>
                <p class="mt-4 max-w-2xl text-base text-white/80">{{ latestEp.subtitle }}</p>

                <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
                  <span class="inline-flex items-center gap-1.5">
                    <app-icon name="clock" [size]="15" />
                    {{ duration(latestEp.durationSec) }}
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <app-icon name="calendar" [size]="15" />
                    {{ date(latestEp.publishedAt) }}
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <app-icon name="list" [size]="15" />
                    {{ t('home.hero.chapters', { count: latestEp.chapters.length }) }}
                  </span>
                </div>

                <div class="mt-7 flex flex-wrap items-center gap-3">
                  <app-play-button [episode]="latestEp" [withLabel]="true" />
                  <a
                    [routerLink]="['/episodio', latestEp.slug]"
                    class="inline-flex h-11 items-center gap-2 rounded-lg border border-white/30 px-5 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <app-icon name="book-open" [size]="16" />
                    {{ t('home.hero.notes') }}
                  </a>
                </div>
              </div>

              <div class="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <img
                  [src]="img(latestEp.coverSeed, 640, 640)"
                  [alt]="latestEp.title"
                  class="aspect-square w-full rounded-xl object-cover"
                />
                <div class="mt-4">
                  <app-waveform
                    [seed]="latestEp.slug"
                    [durationSec]="latestEp.durationSec"
                    [positionSec]="heroPosition()"
                    [bars]="64"
                    [height]="40"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      }

      <!-- ---- Temporadas ---- -->
      <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <header class="max-w-2xl">
          <p class="text-xs font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">
            {{ t('home.seasons.eyebrow') }}
          </p>
          <h2 class="mt-2 text-title-sm font-bold text-heading">{{ t('home.seasons.title') }}</h2>
          <p class="mt-2 text-sm text-muted">{{ t('home.seasons.subtitle') }}</p>
        </header>

        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (season of podcast.seasons(); track season.number) {
            <article class="surface-card rounded-2xl border p-6 shadow-theme-sm">
              <span
                class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15"
              >
                <app-icon name="layers" [size]="20" />
              </span>
              <p class="mt-4 text-xs font-medium text-muted">
                {{ t('episode.season', { season: season.number }) }} · {{ season.year }}
              </p>
              <h3 class="mt-1 text-lg font-semibold text-heading">{{ season.title }}</h3>
              <p class="mt-2 text-sm text-muted">{{ season.description }}</p>
              <a
                routerLink="/episodios"
                [queryParams]="{ temporada: season.number }"
                class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                {{ t('home.seasons.open') }} ·
                {{ t('home.seasons.episodes', { count: seasonCount(season.number) }) }}
                <app-icon name="arrow-right" [size]="14" />
              </a>
            </article>
          }
        </div>
      </section>

      <!-- ---- Episódios recentes ---- -->
      <section class="border-y border-themed bg-gray-50/60 py-14 dark:bg-gray-900/40">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="max-w-2xl">
              <p class="text-xs font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">
                {{ t('home.recent.eyebrow') }}
              </p>
              <h2 class="mt-2 text-title-sm font-bold text-heading">{{ t('home.recent.title') }}</h2>
              <p class="mt-2 text-sm text-muted">{{ t('home.recent.subtitle') }}</p>
            </div>
            <a
              routerLink="/episodios"
              class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-white dark:hover:bg-gray-800"
            >
              {{ t('home.recent.all') }}
              <app-icon name="arrow-right" [size]="15" />
            </a>
          </header>

          <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @for (episode of recent(); track episode.id) {
              <app-episode-card [episode]="episode" />
            }
          </div>
        </div>
      </section>

      <!-- ---- Apresentadores ---- -->
      <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <header class="max-w-2xl">
          <p class="text-xs font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">
            {{ t('home.hosts.eyebrow') }}
          </p>
          <h2 class="mt-2 text-title-sm font-bold text-heading">{{ t('home.hosts.title') }}</h2>
          <p class="mt-2 text-sm text-muted">{{ t('home.hosts.subtitle') }}</p>
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
      </section>

      <!-- ---- Onde ouvir ---- -->
      <section class="border-t border-themed py-14">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header class="max-w-2xl">
            <p class="text-xs font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">
              {{ t('home.platforms.eyebrow') }}
            </p>
            <h2 class="mt-2 text-title-sm font-bold text-heading">{{ t('home.platforms.title') }}</h2>
            <p class="mt-2 text-sm text-muted">{{ t('home.platforms.subtitle') }}</p>
          </header>

          <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (d of podcast.distributions(); track d.platform) {
              <a
                [href]="d.url"
                target="_blank"
                rel="noreferrer noopener"
                class="surface-card flex items-center gap-3 rounded-xl border p-4 transition hover:shadow-theme-sm"
              >
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-body dark:bg-gray-800"
                >
                  <app-icon [name]="platformIcon(d.platform)" [size]="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-heading">{{ d.platform }}</span>
                  <span class="block truncate text-xs text-muted">
                    {{ t('home.platforms.followers', { count: d.followers }) }}
                  </span>
                </span>
                <app-icon name="external-link" [size]="16" class="shrink-0 text-muted" />
              </a>
            }
          </div>
        </div>
      </section>

      <!-- ---- Boletim ---- -->
      <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div class="rounded-2xl bg-brand-500 px-6 py-10 text-white sm:px-10">
          <div class="grid items-center gap-8 lg:grid-cols-2">
            <div class="min-w-0">
              <h2 class="text-title-sm font-bold">{{ t('home.newsletter.title') }}</h2>
              <p class="mt-2 text-sm text-white/85">{{ t('home.newsletter.subtitle') }}</p>
              <p class="mt-4 text-xs text-white/70">
                {{ num(subscribers()) }} {{ t('dashboard.kpi.subscribers').toLowerCase() }} ·
                {{ t('home.newsletter.hint') }}
              </p>
            </div>
            <form (ngSubmit)="subscribe()" class="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                name="email"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                [placeholder]="t('home.newsletter.placeholder')"
                class="h-12 min-w-0 flex-1 rounded-lg border border-white/25 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 focus:outline-none"
              />
              <button
                type="submit"
                class="h-12 shrink-0 rounded-lg bg-white px-6 text-sm font-semibold text-brand-600 transition hover:bg-white/90"
              >
                {{ t('home.newsletter.cta') }}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class HomePageComponent {
  podcast = inject(PodcastService);
  private player = inject(PlayerService);
  private ui = inject(UiService);
  private transloco = inject(TranslocoService);
  private lang = activeLang();

  protected readonly hosts = HOSTS;
  protected readonly email = signal('');

  protected readonly published = computed(() => publishedEpisodes(this.podcast.episodes()));
  protected readonly latest = computed(() => latestEpisode(this.podcast.episodes()));
  protected readonly recent = computed(() => this.published().slice(0, 6));

  protected readonly heroPosition = computed(() => {
    const l = this.latest();
    return l && this.player.episodeId() === l.id ? this.player.positionSec() : 0;
  });

  protected readonly subscribers = computed(() => {
    const rows = this.podcast.monthlySubscribers();
    return rows.length ? rows[rows.length - 1].value : 0;
  });

  constructor() {
    usePageTitle();
  }

  protected seasonCount(season: number) {
    return episodesOfSeason(this.published(), season).length;
  }

  protected img = pcImage;
  protected duration = formatDurationLong;
  protected date(iso: string) {
    return formatDate(iso, this.lang());
  }
  protected num(v: number) {
    return formatNumber(v, this.lang());
  }
  protected platformIcon(p: PlatformName) {
    return PLATFORM_ICON[p];
  }

  protected subscribe() {
    if (!this.email().trim()) return;
    this.ui.notifySuccess(this.transloco.translate('home.newsletter.success'));
    this.email.set('');
  }
}
