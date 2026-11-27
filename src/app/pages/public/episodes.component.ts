import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule } from '@jsverse/transloco';
import { EmptyStateComponent } from '@app/components/ui/empty-state.component';
import { FilterBarComponent } from '@app/components/ui/filter-bar.component';
import { FilterSelectComponent } from '@app/components/ui/filter-select.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { PaginationComponent } from '@app/components/ui/pagination.component';
import { EpisodeCardComponent } from '@app/components/pc/episode-card.component';
import { filterEpisodes, publishedEpisodes, type EpisodeFilters } from '@app/core/data/query';
import { PodcastService } from '@app/core/services/podcast.service';
import { usePageTitle } from '@app/core/page-title';

const PER_PAGE = 9;

type Duration = NonNullable<EpisodeFilters['duration']>;
type Sort = NonNullable<EpisodeFilters['sort']>;

@Component({
  selector: 'app-episodes-page',
  standalone: true,
  imports: [
    TranslocoModule,
    EmptyStateComponent,
    FilterBarComponent,
    FilterSelectComponent,
    IconComponent,
    PaginationComponent,
    EpisodeCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" *transloco="let t">
      <header class="max-w-2xl">
        <p class="text-xs font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">
          {{ t('episodes.eyebrow') }}
        </p>
        <h1 class="mt-2 text-title-sm font-bold text-heading">{{ t('episodes.title') }}</h1>
        <p class="mt-2 text-sm text-muted">{{ t('episodes.subtitle') }}</p>
      </header>

      <div class="mt-8">
        <app-filter-bar
          [search]="term()"
          (searchChange)="term.set($event)"
          [searchPlaceholder]="t('episodes.searchPlaceholder')"
        >
          <app-filter-select [value]="season()" (valueChange)="season.set($event)" [label]="t('episodes.season')">
            <option value="all">{{ t('episodes.allSeasons') }}</option>
            @for (s of podcast.seasons(); track s.number) {
              <option [value]="s.number">{{ t('episode.season', { season: s.number }) }} — {{ s.title }}</option>
            }
          </app-filter-select>

          <app-filter-select [value]="guestId()" (valueChange)="guestId.set($event)" [label]="t('episodes.guest')">
            <option value="all">{{ t('episodes.allGuests') }}</option>
            @for (g of podcast.guests(); track g.id) {
              <option [value]="g.id">{{ g.name }}</option>
            }
          </app-filter-select>

          <app-filter-select
            [value]="duration()"
            (valueChange)="duration.set($any($event))"
            [label]="t('episodes.duration')"
          >
            @for (d of durations; track d) {
              <option [value]="d">{{ t('episodes.durations.' + d) }}</option>
            }
          </app-filter-select>

          <app-filter-select [value]="sort()" (valueChange)="sort.set($any($event))" [label]="t('episodes.sort')">
            @for (s of sorts; track s) {
              <option [value]="s">{{ t('episodes.sorts.' + s) }}</option>
            }
          </app-filter-select>

          @if (hasFilters()) {
            <button
              filterAction
              type="button"
              (click)="clearFilters()"
              class="inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <app-icon name="x" [size]="14" />
              {{ t('common.clear') }}
            </button>
          }
        </app-filter-bar>

        <p class="mb-5 text-sm text-muted">{{ t('episodes.count', { count: rows().length }) }}</p>

        @if (pageRows().length === 0) {
          <div class="surface-card rounded-2xl border">
            <app-empty-state
              icon="mic"
              [title]="t('episodes.emptyTitle')"
              [description]="t('episodes.emptyDesc')"
            >
              <button
                type="button"
                (click)="clearFilters()"
                class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                {{ t('common.clear') }}
              </button>
            </app-empty-state>
          </div>
        } @else {
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @for (episode of pageRows(); track episode.id) {
              <app-episode-card [episode]="episode" />
            }
          </div>
          <div class="mt-10">
            <app-pagination [page]="page()" [totalPages]="totalPages()" (onChange)="page.set($event)" />
          </div>
        }
      </div>
    </div>
  `,
})
export class EpisodesPageComponent {
  podcast = inject(PodcastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly durations: Duration[] = ['all', 'curto', 'medio', 'longo'];
  protected readonly sorts: Sort[] = ['recentes', 'antigos', 'populares', 'longos', 'curtos'];

  protected readonly term = signal('');
  protected readonly season = signal<string>(
    this.route.snapshot.queryParamMap.get('temporada') ?? 'all'
  );
  protected readonly guestId = signal<string>('all');
  protected readonly duration = signal<Duration>('all');
  protected readonly sort = signal<Sort>('recentes');
  protected readonly page = signal(1);

  private readonly published = computed(() => publishedEpisodes(this.podcast.episodes()));

  protected readonly rows = computed(() =>
    filterEpisodes(this.published(), {
      term: this.term(),
      season: this.season() === 'all' ? 'all' : Number(this.season()),
      guestId: this.guestId() === 'all' ? 'all' : Number(this.guestId()),
      duration: this.duration(),
      sort: this.sort(),
    })
  );

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.rows().length / PER_PAGE)));
  protected readonly pageRows = computed(() =>
    this.rows().slice((this.page() - 1) * PER_PAGE, this.page() * PER_PAGE)
  );

  protected readonly hasFilters = computed(
    () =>
      Boolean(this.term()) ||
      this.season() !== 'all' ||
      this.guestId() !== 'all' ||
      this.duration() !== 'all'
  );

  constructor() {
    usePageTitle('episodes.title');

    // Voltar para a primeira página sempre que um filtro muda.
    effect(() => {
      this.term();
      this.season();
      this.guestId();
      this.duration();
      this.sort();
      this.page.set(1);
    });

    // A temporada escolhida vira endereço, para o link da home funcionar.
    effect(() => {
      const season = this.season();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { temporada: season === 'all' ? null : season },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    // Entrar pela home com ?temporada=N já filtra.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const value = params.get('temporada') ?? 'all';
      if (value !== this.season()) this.season.set(value);
    });
  }

  protected clearFilters() {
    this.term.set('');
    this.season.set('all');
    this.guestId.set('all');
    this.duration.set('all');
    this.sort.set('recentes');
  }
}
