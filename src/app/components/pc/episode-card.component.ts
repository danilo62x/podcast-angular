import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { pcImage } from '@app/core/data/mock';
import type { Episode } from '@app/core/data/types';
import { formatDate, formatDurationLong, formatNumber } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';
import { PlayButtonComponent } from './play-button.component';
import {
  CountdownBadgeComponent,
  EpisodeStatusPillComponent,
  ExplicitPillComponent,
} from './status-pill.component';

@Component({
  selector: 'app-episode-card',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    TranslocoModule,
    IconComponent,
    PlayButtonComponent,
    EpisodeStatusPillComponent,
    ExplicitPillComponent,
    CountdownBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <ng-template #meta>
        <span class="inline-flex items-center gap-1">
          <app-icon name="clock" [size]="13" />
          {{ duration() }}
        </span>
        <span class="inline-flex items-center gap-1">
          <app-icon name="calendar" [size]="13" />
          {{ date() }}
        </span>
        @if (episode.status === 'publicado') {
          <span class="inline-flex items-center gap-1">
            <app-icon name="headphones" [size]="13" />
            {{ downloads() }}
          </span>
        }
      </ng-template>

      @if (layout === 'row') {
        <div class="surface-card flex items-center gap-4 rounded-xl border p-4">
          <img
            [src]="cover(160, 160)"
            alt=""
            class="hidden h-16 w-16 shrink-0 rounded-lg object-cover sm:block"
          />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-brand-600 dark:text-brand-400">
              {{ t('episode.seasonEpisode', { season: episode.season, number: episode.number }) }}
            </p>
            <a
              [routerLink]="['/episodio', episode.slug]"
              class="mt-0.5 block truncate text-sm font-semibold text-heading hover:text-brand-600"
            >
              {{ episode.title }}
            </a>
            <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <ng-container [ngTemplateOutlet]="meta" />
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            @if (showStatus) {
              <app-episode-status-pill [status]="episode.status" />
            }
            @if (episode.status === 'publicado') {
              <app-play-button [episode]="episode" size="sm" variant="ghost" />
            }
          </div>
        </div>
      } @else {
        <article
          class="surface-card flex flex-col overflow-hidden rounded-2xl border shadow-theme-sm transition hover:shadow-theme-md"
        >
          <div class="relative">
            <a [routerLink]="['/episodio', episode.slug]">
              <img
                [src]="cover(640, 400)"
                [alt]="episode.title"
                class="h-44 w-full object-cover"
                loading="lazy"
              />
            </a>
            @if (episode.status === 'publicado') {
              <div class="absolute right-3 bottom-3">
                <app-play-button [episode]="episode" size="md" />
              </div>
            }
            <div class="absolute top-3 left-3 flex flex-wrap gap-2">
              <span
                class="rounded-full bg-gray-900/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur"
              >
                {{ t('episode.seasonEpisode', { season: episode.season, number: episode.number }) }}
              </span>
              @if (episode.explicit) {
                <app-explicit-pill />
              }
            </div>
          </div>

          <div class="flex flex-1 flex-col p-5">
            @if (showStatus) {
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <app-episode-status-pill [status]="episode.status" />
                @if (episode.status === 'agendado' && episode.scheduledAt) {
                  <app-countdown-badge [scheduledAt]="episode.scheduledAt" />
                }
              </div>
            }
            <h3 class="text-base font-semibold text-heading">
              <a [routerLink]="['/episodio', episode.slug]" class="hover:text-brand-600">{{ episode.title }}</a>
            </h3>
            <p class="mt-2 line-clamp-2 text-sm text-muted">{{ episode.subtitle }}</p>
            <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <ng-container [ngTemplateOutlet]="meta" />
            </div>
          </div>
        </article>
      }
    </ng-container>
  `,
})
export class EpisodeCardComponent {
  @Input({ required: true }) episode!: Episode;
  /** `grid` para cartão com capa; `row` para linha compacta em lista. */
  @Input() layout: 'grid' | 'row' = 'grid';
  @Input() showStatus = false;

  private lang = activeLang();

  protected cover(w: number, h: number) {
    return pcImage(this.episode.coverSeed, w, h);
  }
  protected duration() {
    return formatDurationLong(this.episode.durationSec);
  }
  protected date() {
    return formatDate(this.episode.publishedAt, this.lang());
  }
  protected downloads() {
    return formatNumber(this.episode.downloads, this.lang());
  }
}
