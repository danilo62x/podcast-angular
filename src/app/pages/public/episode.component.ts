import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmptyStateComponent } from '@app/components/ui/empty-state.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { BlockViewComponent } from '@app/components/pc/block-view.component';
import { ChapterListComponent } from '@app/components/pc/chapter-list.component';
import { EpisodeCardComponent } from '@app/components/pc/episode-card.component';
import { GuestCardComponent } from '@app/components/pc/guest-card.component';
import { PlayButtonComponent } from '@app/components/pc/play-button.component';
import { TranscriptViewComponent } from '@app/components/pc/transcript-view.component';
import { WaveformComponent } from '@app/components/pc/waveform.component';
import { ExplicitPillComponent } from '@app/components/pc/status-pill.component';
import { pcImage } from '@app/core/data/mock';
import { episodeBySlug, guestsOf, relatedEpisodes } from '@app/core/data/query';
import { PlayerService } from '@app/core/services/player.service';
import { PodcastService } from '@app/core/services/podcast.service';
import { setLiteralTitle } from '@app/core/page-title';
import { formatClock, formatDate, formatDurationLong, formatNumber, formatPercent } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

@Component({
  selector: 'app-episode-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoModule,
    EmptyStateComponent,
    IconComponent,
    BlockViewComponent,
    ChapterListComponent,
    EpisodeCardComponent,
    GuestCardComponent,
    PlayButtonComponent,
    TranscriptViewComponent,
    WaveformComponent,
    ExplicitPillComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (episode(); as ep) {
        <div>
          <!-- ---- Cabeçalho ---- -->
          <section class="border-b border-themed">
            <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <div class="grid gap-8 lg:grid-cols-[220px_1fr]">
                <img
                  [src]="img(ep.coverSeed, 480, 480)"
                  [alt]="ep.title"
                  class="aspect-square w-full max-w-[220px] rounded-2xl object-cover shadow-theme-md"
                />

                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    >
                      {{ t('episode.seasonEpisode', { season: ep.season, number: ep.number }) }}
                    </span>
                    @if (ep.explicit) {
                      <app-explicit-pill />
                    }
                  </div>

                  <h1 class="mt-3 text-2xl font-bold text-heading sm:text-title-sm">{{ ep.title }}</h1>
                  <p class="mt-2 max-w-2xl text-sm text-muted">{{ ep.subtitle }}</p>

                  <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
                    <span class="inline-flex items-center gap-1.5">
                      <app-icon name="clock" [size]="14" />
                      {{ duration(ep.durationSec) }}
                    </span>
                    <span class="inline-flex items-center gap-1.5">
                      <app-icon name="calendar" [size]="14" />
                      {{ t('episode.publishedOn', { date: date(ep.publishedAt) }) }}
                    </span>
                    <span class="inline-flex items-center gap-1.5">
                      <app-icon name="headphones" [size]="14" />
                      {{ num(ep.downloads) }} {{ t('episode.downloads').toLowerCase() }}
                    </span>
                  </div>

                  <!-- Player do episódio — espelha a barra fixa do rodapé. -->
                  <div class="surface-card mt-6 rounded-2xl border p-4">
                    <div class="flex flex-wrap items-center gap-3">
                      <app-play-button [episode]="ep" [withLabel]="true" />
                      <button
                        type="button"
                        (click)="isCurrent() ? player.skip(-15) : jumpTo(0)"
                        class="inline-flex h-11 items-center gap-2 rounded-lg border border-themed px-3 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <app-icon name="skip-back" [size]="16" />
                        15s
                      </button>
                      <button
                        type="button"
                        (click)="isCurrent() ? player.skip(15) : jumpTo(15)"
                        class="inline-flex h-11 items-center gap-2 rounded-lg border border-themed px-3 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <app-icon name="skip-forward" [size]="16" />
                        15s
                      </button>
                      <button
                        type="button"
                        (click)="player.cycleSpeed()"
                        class="inline-flex h-11 items-center gap-2 rounded-lg border border-themed px-3 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <app-icon name="gauge" [size]="16" />
                        {{ player.speed() }}x
                      </button>
                      <span class="ml-auto font-mono text-xs text-muted tabular-nums">
                        {{ clock(position()) }} / {{ clock(ep.durationSec) }}
                      </span>
                    </div>

                    <div class="mt-4">
                      <app-waveform
                        [seed]="ep.slug"
                        [durationSec]="ep.durationSec"
                        [positionSec]="position()"
                        [bars]="120"
                        [height]="56"
                        [seekable]="true"
                        (seek)="jumpTo($event)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ---- Conteúdo ---- -->
          <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div class="grid gap-8 lg:grid-cols-[1fr_340px]">
              <div class="min-w-0 space-y-10">
                <div>
                  <h2 class="text-lg font-semibold text-heading">{{ t('episode.about') }}</h2>
                  <div class="mt-4">
                    <app-block-view [blocks]="ep.blocks" />
                  </div>
                  @if (ep.tags.length > 0) {
                    <div class="mt-6 flex flex-wrap items-center gap-2">
                      <span class="text-xs font-medium text-muted">{{ t('episode.tags') }}:</span>
                      @for (tag of ep.tags; track tag) {
                        <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-body dark:bg-gray-800">
                          {{ tag }}
                        </span>
                      }
                    </div>
                  }
                </div>

                <div>
                  <h2 class="text-lg font-semibold text-heading">{{ t('episode.transcript') }}</h2>
                  <p class="mt-1 mb-4 text-sm text-muted">{{ t('episode.transcriptHint') }}</p>
                  <app-transcript-view
                    [transcript]="ep.transcript"
                    [positionSec]="position()"
                    (select)="jumpTo($event)"
                  />
                </div>

                @if (related().length > 0) {
                  <div>
                    <h2 class="text-lg font-semibold text-heading">{{ t('episode.related') }}</h2>
                    <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      @for (r of related(); track r.id) {
                        <app-episode-card [episode]="r" />
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- ---- Coluna lateral ---- -->
              <aside class="min-w-0 space-y-6">
                <div class="surface-card rounded-2xl border p-5">
                  <h3 class="text-sm font-semibold text-heading">{{ t('episode.chapters') }}</h3>
                  <p class="mt-1 mb-3 text-xs text-muted">{{ t('episode.chaptersHint') }}</p>
                  <app-chapter-list
                    [chapters]="ep.chapters"
                    [durationSec]="ep.durationSec"
                    [positionSec]="position()"
                    (select)="jumpTo($event)"
                  />
                </div>

                @if (episodeGuests().length > 0) {
                  <div class="surface-card rounded-2xl border p-5">
                    <h3 class="mb-3 text-sm font-semibold text-heading">{{ t('episode.guests') }}</h3>
                    <div class="space-y-2">
                      @for (guest of episodeGuests(); track guest.id) {
                        <app-guest-card [guest]="guest" [compact]="true" />
                      }
                    </div>
                  </div>
                }

                <div class="surface-card rounded-2xl border p-5">
                  <h3 class="mb-3 text-sm font-semibold text-heading">{{ t('audience.title') }}</h3>
                  <dl class="space-y-3 text-sm">
                    <div class="flex items-center justify-between gap-3">
                      <dt class="text-muted">{{ t('episode.downloads') }}</dt>
                      <dd class="font-semibold text-heading">{{ num(ep.downloads) }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <dt class="text-muted">{{ t('episode.listeners') }}</dt>
                      <dd class="font-semibold text-heading">{{ num(ep.uniqueListeners) }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <dt class="text-muted">{{ t('episode.completion') }}</dt>
                      <dd class="font-semibold text-heading">{{ pct(ep.completionRate) }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <dt class="text-muted">{{ t('episode.duration') }}</dt>
                      <dd class="font-semibold text-heading">{{ duration(ep.durationSec) }}</dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </div>
          </section>
        </div>
      } @else {
        <div class="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <app-empty-state
            icon="mic"
            [title]="t('episode.notFoundTitle')"
            [description]="t('episode.notFoundDesc')"
          >
            <a
              routerLink="/episodios"
              class="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              <app-icon name="arrow-right" [size]="16" />
              {{ t('episode.backToList') }}
            </a>
          </app-empty-state>
        </div>
      }
    </ng-container>
  `,
})
export class EpisodePageComponent {
  /** Vem do `withComponentInputBinding()` — rota `/episodio/:slug`. */
  readonly slug = input<string>('');

  protected player = inject(PlayerService);
  private podcast = inject(PodcastService);
  private transloco = inject(TranslocoService);
  private lang = activeLang();

  private readonly found = computed(() => episodeBySlug(this.podcast.episodes(), this.slug()));

  protected readonly episode = computed(() => {
    const e = this.found();
    return e && e.status === 'publicado' ? e : undefined;
  });

  protected readonly related = computed(() => {
    const e = this.episode();
    return e ? relatedEpisodes(this.podcast.episodes(), e, 3) : [];
  });

  protected readonly episodeGuests = computed(() => {
    const e = this.episode();
    return e ? guestsOf(this.podcast.guests(), e) : [];
  });

  protected readonly isCurrent = computed(() => this.player.episodeId() === this.episode()?.id);
  protected readonly position = computed(() => (this.isCurrent() ? this.player.positionSec() : 0));

  constructor() {
    // O título é o próprio nome do episódio — literal, não é chave de i18n.
    effect(() => {
      const e = this.episode();
      setLiteralTitle(e ? e.title : '');
    });
    // Mantém o título coerente ao trocar de idioma (base traduzida à parte).
    this.transloco.langChanges$.pipe(takeUntilDestroyed()).subscribe(() => {
      const e = this.episode();
      setLiteralTitle(e ? e.title : '');
    });
  }

  /** Salta a posição — carrega o episódio na barra global se ele ainda não estiver lá. */
  protected jumpTo(sec: number) {
    const e = this.episode();
    if (!e) return;
    if (!this.isCurrent()) this.player.load(e.id, e.durationSec, true);
    this.player.seek(sec);
  }

  protected img = pcImage;
  protected clock = formatClock;
  protected duration = formatDurationLong;
  protected date(iso: string) {
    return formatDate(iso, this.lang());
  }
  protected num(v: number) {
    return formatNumber(v, this.lang());
  }
  protected pct(v: number) {
    return formatPercent(v, this.lang());
  }
}
