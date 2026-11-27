import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '@app/components/app/page-header.component';
import { DataTableComponent, type DataColumn } from '@app/components/ui/data-table.component';
import { EmptyStateComponent } from '@app/components/ui/empty-state.component';
import { FilterBarComponent } from '@app/components/ui/filter-bar.component';
import { FilterSelectComponent } from '@app/components/ui/filter-select.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { ModalComponent } from '@app/components/ui/modal.component';
import { CountdownBadgeComponent, EpisodeStatusPillComponent } from '@app/components/pc/status-pill.component';
import { pcImage } from '@app/core/data/mock';
import { episodeText } from '@app/core/data/query';
import type { Episode, EpisodeStatus } from '@app/core/data/types';
import { PodcastService } from '@app/core/services/podcast.service';
import { UiService } from '@app/core/services/ui.service';
import { usePageTitle } from '@app/core/page-title';
import { formatDate, formatDurationLong, formatNumber } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

/** Data local no formato aceito por `<input type="datetime-local">`. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

@Component({
  selector: 'app-episodes-admin-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslocoModule,
    PageHeaderComponent,
    DataTableComponent,
    EmptyStateComponent,
    FilterBarComponent,
    FilterSelectComponent,
    IconComponent,
    ModalComponent,
    CountdownBadgeComponent,
    EpisodeStatusPillComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *transloco="let t">
      <app-page-header [title]="t('episodesAdmin.title')" [subtitle]="t('episodesAdmin.subtitle')">
        <a
          routerLink="/app/episodios/novo"
          class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <app-icon name="plus" [size]="16" />
          {{ t('episodesAdmin.new') }}
        </a>
      </app-page-header>

      <app-filter-bar
        [search]="term()"
        (searchChange)="term.set($event)"
        [searchPlaceholder]="t('episodesAdmin.searchPlaceholder')"
      >
        <app-filter-select [value]="status()" (valueChange)="status.set($any($event))" [label]="t('common.status')">
          <option value="all">{{ t('episodesAdmin.allStatus') }}</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ t('episodeStatuses.' + s) }}</option>
          }
        </app-filter-select>
        <app-filter-select
          [value]="season()"
          (valueChange)="season.set($event)"
          [label]="t('episodesAdmin.table.season')"
        >
          <option value="all">{{ t('episodesAdmin.allSeasons') }}</option>
          @for (s of podcast.seasons(); track s.number) {
            <option [value]="s.number">{{ t('episode.season', { season: s.number }) }}</option>
          }
        </app-filter-select>
      </app-filter-bar>

      @if (rows().length === 0) {
        <div class="surface-card rounded-2xl border">
          <app-empty-state
            icon="mic"
            [title]="t('episodesAdmin.emptyTitle')"
            [description]="t('episodesAdmin.emptyDesc')"
          >
            <a
              routerLink="/app/episodios/novo"
              class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              <app-icon name="plus" [size]="16" />
              {{ t('episodesAdmin.new') }}
            </a>
          </app-empty-state>
        </div>
      } @else {
        <app-data-table [columns]="columns()" [data]="rows()" [pageSize]="10" [searchable]="false" />
      }

      <!-- ---- Agendar ---- -->
      <app-modal
        [open]="scheduling() !== null"
        (closed)="scheduling.set(null)"
        [title]="t('episodesAdmin.scheduleTitle')"
        [subtitle]="scheduling()?.title"
        [hasFooter]="true"
      >
        <label class="block text-sm font-medium text-heading" for="schedule-at">
          {{ t('episodesAdmin.scheduleDate') }}
        </label>
        <input
          id="schedule-at"
          type="datetime-local"
          [ngModel]="scheduleAt()"
          (ngModelChange)="scheduleAt.set($event)"
          class="focus-ring mt-2 w-full rounded-lg border border-themed bg-transparent px-3 py-2.5 text-sm text-body"
        />
        <p class="mt-2 text-xs text-muted">{{ t('episodesAdmin.scheduleHint') }}</p>

        <ng-container modalFooter>
          <button
            type="button"
            (click)="scheduling.set(null)"
            class="rounded-lg border border-themed px-4 py-2 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            (click)="confirmSchedule()"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {{ t('common.save') }}
          </button>
        </ng-container>
      </app-modal>

      <!-- ---- Excluir ---- -->
      <app-modal
        [open]="removing() !== null"
        (closed)="removing.set(null)"
        [title]="t('episodesAdmin.confirmRemove')"
        [subtitle]="removing()?.title"
        [hasFooter]="true"
      >
        <p class="text-sm text-muted">{{ t('episodesAdmin.confirmRemoveDesc') }}</p>

        <ng-container modalFooter>
          <button
            type="button"
            (click)="removing.set(null)"
            class="rounded-lg border border-themed px-4 py-2 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            (click)="confirmRemove()"
            class="rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-error-600"
          >
            {{ t('common.remove') }}
          </button>
        </ng-container>
      </app-modal>
    </div>

    <!-- ---- Células ---- -->
    <ng-template #episodeCell let-e>
      <div class="flex min-w-0 items-center gap-3">
        <img
          [src]="cover(e.coverSeed)"
          alt=""
          class="hidden h-10 w-10 shrink-0 rounded-lg object-cover sm:block"
        />
        <div class="min-w-0">
          <a
            [routerLink]="['/app/episodios', e.id]"
            class="block max-w-[16rem] truncate font-medium text-heading hover:text-brand-600"
          >
            {{ e.number }}. {{ e.title }}
          </a>
          <span class="block max-w-[16rem] truncate text-xs text-muted">{{ e.subtitle }}</span>
        </div>
      </div>
    </ng-template>

    <ng-template #seasonCell let-e>
      <span class="text-muted tabular-nums">{{ e.season }}</span>
    </ng-template>

    <ng-template #durationCell let-e>
      <span class="whitespace-nowrap text-muted">{{ duration(e.durationSec) }}</span>
    </ng-template>

    <ng-template #downloadsCell let-e>
      <span class="tabular-nums text-muted">
        {{ e.status === 'publicado' ? num(e.downloads) : '—' }}
      </span>
    </ng-template>

    <ng-template #dateCell let-e>
      <span class="whitespace-nowrap text-muted">{{ date(e.publishedAt) }}</span>
    </ng-template>

    <ng-template #statusCell let-e>
      <div class="flex flex-wrap items-center gap-2">
        <app-episode-status-pill [status]="e.status" />
        @if (e.status === 'agendado' && e.scheduledAt) {
          <app-countdown-badge [scheduledAt]="e.scheduledAt" />
        }
      </div>
    </ng-template>

    <ng-template #actionsCell let-e>
      <div class="flex items-center justify-end gap-1">
        <button
          type="button"
          [title]="'episodesAdmin.open' | transloco"
          (click)="open(e)"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-brand-600"
        >
          <app-icon name="edit" [size]="15" />
        </button>
        @if (e.status !== 'publicado') {
          <button
            type="button"
            [title]="'episodesAdmin.publish' | transloco"
            (click)="publish(e)"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-success-600"
          >
            <app-icon name="upload" [size]="15" />
          </button>
        } @else {
          <button
            type="button"
            [title]="'episodesAdmin.unpublish' | transloco"
            (click)="unpublish(e)"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-warning-600"
          >
            <app-icon name="file-text" [size]="15" />
          </button>
        }
        <button
          type="button"
          [title]="'episodesAdmin.schedule' | transloco"
          (click)="openSchedule(e)"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-brand-600"
        >
          <app-icon name="calendar-clock" [size]="15" />
        </button>
        <button
          type="button"
          [title]="'episodesAdmin.duplicate' | transloco"
          (click)="duplicate(e)"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-brand-600"
        >
          <app-icon name="copy" [size]="15" />
        </button>
        <button
          type="button"
          [title]="'common.remove' | transloco"
          (click)="removing.set(e)"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-error-500"
        >
          <app-icon name="trash" [size]="15" />
        </button>
      </div>
    </ng-template>
  `,
})
export class EpisodesAdminPageComponent {
  podcast = inject(PodcastService);
  private ui = inject(UiService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);
  private lang = activeLang();

  @ViewChild('episodeCell', { static: true }) episodeCell!: TemplateRef<{ $implicit: Episode }>;
  @ViewChild('seasonCell', { static: true }) seasonCell!: TemplateRef<{ $implicit: Episode }>;
  @ViewChild('durationCell', { static: true }) durationCell!: TemplateRef<{ $implicit: Episode }>;
  @ViewChild('downloadsCell', { static: true }) downloadsCell!: TemplateRef<{ $implicit: Episode }>;
  @ViewChild('dateCell', { static: true }) dateCell!: TemplateRef<{ $implicit: Episode }>;
  @ViewChild('statusCell', { static: true }) statusCell!: TemplateRef<{ $implicit: Episode }>;
  @ViewChild('actionsCell', { static: true }) actionsCell!: TemplateRef<{ $implicit: Episode }>;

  protected readonly statuses: EpisodeStatus[] = ['rascunho', 'agendado', 'publicado'];

  protected readonly term = signal('');
  protected readonly status = signal<EpisodeStatus | 'all'>('all');
  protected readonly season = signal<string>('all');

  protected readonly scheduling = signal<Episode | null>(null);
  protected readonly scheduleAt = signal('');
  protected readonly removing = signal<Episode | null>(null);

  protected readonly rows = computed(() => {
    const q = this.term().trim().toLowerCase();
    const status = this.status();
    const season = this.season();
    return this.podcast
      .episodes()
      .filter((e) => {
        if (q && !episodeText(e).includes(q)) return false;
        if (status !== 'all' && e.status !== status) return false;
        if (season !== 'all' && e.season !== Number(season)) return false;
        return true;
      })
      .sort((a, b) => b.number - a.number);
  });

  protected readonly columns = computed<DataColumn<Episode>[]>(() => {
    // Depende do idioma para os cabeçalhos serem retraduzidos.
    this.lang();
    const t = (key: string) => this.transloco.translate(key);
    return [
      { key: 'episode', header: t('episodesAdmin.table.episode'), accessor: (r) => r.title, cell: this.episodeCell },
      { key: 'season', header: t('episodesAdmin.table.season'), accessor: (r) => r.season, cell: this.seasonCell },
      {
        key: 'duration',
        header: t('episodesAdmin.table.duration'),
        accessor: (r) => r.durationSec,
        cell: this.durationCell,
      },
      {
        key: 'downloads',
        header: t('episodesAdmin.table.downloads'),
        accessor: (r) => r.downloads,
        cell: this.downloadsCell,
      },
      { key: 'date', header: t('episodesAdmin.table.date'), accessor: (r) => r.publishedAt, cell: this.dateCell },
      { key: 'status', header: t('episodesAdmin.table.status'), accessor: (r) => r.status, cell: this.statusCell },
      { key: 'actions', header: t('common.actions'), sortable: false, align: 'right', cell: this.actionsCell },
    ];
  });

  constructor() {
    usePageTitle('episodesAdmin.title');
  }

  protected cover(seed: string) {
    return pcImage(seed, 96, 96);
  }
  protected duration = formatDurationLong;
  protected num(v: number) {
    return formatNumber(v, this.lang());
  }
  protected date(iso: string) {
    return formatDate(iso, this.lang());
  }

  protected open(episode: Episode) {
    this.router.navigate(['/app/episodios', episode.id]);
  }

  protected publish(episode: Episode) {
    this.podcast.publishEpisode(episode.id);
    this.ui.notifySuccess(this.transloco.translate('episodesAdmin.published'));
  }

  protected unpublish(episode: Episode) {
    this.podcast.unpublishEpisode(episode.id);
    this.ui.notifySuccess(this.transloco.translate('episodesAdmin.unpublished'));
  }

  protected duplicate(episode: Episode) {
    this.podcast.duplicateEpisode(episode.id);
    this.ui.notifySuccess(this.transloco.translate('episodesAdmin.duplicated'));
  }

  protected openSchedule(episode: Episode) {
    this.scheduling.set(episode);
    this.scheduleAt.set(
      toLocalInput(episode.scheduledAt ?? new Date(Date.now() + 86400000).toISOString())
    );
  }

  protected confirmSchedule() {
    const episode = this.scheduling();
    if (!episode || !this.scheduleAt()) return;
    this.podcast.scheduleEpisode(episode.id, new Date(this.scheduleAt()).toISOString());
    this.ui.notifySuccess(this.transloco.translate('episodesAdmin.scheduled'));
    this.scheduling.set(null);
  }

  protected confirmRemove() {
    const episode = this.removing();
    if (episode) this.podcast.removeEpisode(episode.id);
    this.ui.notifySuccess(this.transloco.translate('episodesAdmin.removed'));
    this.removing.set(null);
  }
}
