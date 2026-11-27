import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { EmptyStateComponent } from '@app/components/ui/empty-state.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { EpisodeCardComponent } from '@app/components/pc/episode-card.component';
import { episodesOfGuest, guestBySlug } from '@app/core/data/query';
import { PodcastService } from '@app/core/services/podcast.service';
import { setLiteralTitle } from '@app/core/page-title';

@Component({
  selector: 'app-guest-page',
  standalone: true,
  imports: [RouterLink, TranslocoModule, EmptyStateComponent, IconComponent, EpisodeCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (guest(); as g) {
        <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div class="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside class="min-w-0">
              <div class="surface-card rounded-2xl border p-6 shadow-theme-sm">
                <img [src]="g.avatar" [alt]="g.name" class="h-24 w-24 rounded-full object-cover" />
                <p
                  class="mt-5 text-xs font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400"
                >
                  {{ t('guest.eyebrow') }}
                </p>
                <h1 class="mt-1 text-xl font-bold text-heading">{{ g.name }}</h1>
                <p class="text-sm text-muted">{{ g.role }}</p>
                <p class="mt-4 text-sm leading-relaxed text-body">{{ g.bio }}</p>

                @if (g.links.length > 0) {
                  <div class="mt-6">
                    <h2 class="text-xs font-semibold tracking-wider text-muted uppercase">
                      {{ t('guest.links') }}
                    </h2>
                    <div class="mt-3 flex flex-col gap-2">
                      @for (link of g.links; track link.href) {
                        <a
                          [href]="link.href"
                          target="_blank"
                          rel="noreferrer noopener"
                          class="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                          <app-icon name="external-link" [size]="15" class="shrink-0" />
                          <span class="truncate">{{ link.label }}</span>
                        </a>
                      }
                    </div>
                  </div>
                }

                <p class="mt-6 inline-flex items-center gap-1.5 text-xs text-muted">
                  <app-icon name="mic" [size]="14" />
                  {{ t('guest.episodeCount', { count: guestEpisodes().length }) }}
                </p>
              </div>
            </aside>

            <section class="min-w-0">
              <h2 class="text-lg font-semibold text-heading">{{ t('guest.episodes') }}</h2>
              @if (guestEpisodes().length === 0) {
                <div class="surface-card mt-4 rounded-2xl border">
                  <app-empty-state
                    icon="mic"
                    [title]="t('episodes.emptyTitle')"
                    [description]="t('episodes.emptyDesc')"
                  />
                </div>
              } @else {
                <div class="mt-4 grid gap-5 sm:grid-cols-2">
                  @for (episode of guestEpisodes(); track episode.id) {
                    <app-episode-card [episode]="episode" />
                  }
                </div>
              }
            </section>
          </div>
        </div>
      } @else {
        <div class="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <app-empty-state
            icon="users"
            [title]="t('guest.notFoundTitle')"
            [description]="t('guest.notFoundDesc')"
          >
            <a
              routerLink="/episodios"
              class="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              <app-icon name="arrow-right" [size]="16" />
              {{ t('guest.back') }}
            </a>
          </app-empty-state>
        </div>
      }
    </ng-container>
  `,
})
export class GuestPageComponent {
  /** Vem do `withComponentInputBinding()` — rota `/convidado/:slug`. */
  readonly slug = input<string>('');

  private podcast = inject(PodcastService);

  protected readonly guest = computed(() => guestBySlug(this.podcast.guests(), this.slug()));
  protected readonly guestEpisodes = computed(() => {
    const g = this.guest();
    return g ? episodesOfGuest(this.podcast.episodes(), g.id) : [];
  });

  constructor() {
    effect(() => setLiteralTitle(this.guest()?.name ?? ''));
  }
}
