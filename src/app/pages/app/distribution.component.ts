import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '@app/components/app/page-header.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { ModalComponent } from '@app/components/ui/modal.component';
import { RssPreviewComponent } from '@app/components/pc/rss-preview.component';
import { SponsorRowComponent } from '@app/components/pc/sponsor-row.component';
import { PLATFORM_ICON } from '@app/components/pc/platform-bars.component';
import { FeedStatePillComponent } from '@app/components/pc/status-pill.component';
import { SHOW } from '@app/core/data/mock';
import { publishedEpisodes, totalSponsorRevenue } from '@app/core/data/query';
import type { AdSlot, PlatformName, Sponsor } from '@app/core/data/types';
import { PodcastService } from '@app/core/services/podcast.service';
import { UiService } from '@app/core/services/ui.service';
import { usePageTitle } from '@app/core/page-title';
import { formatCurrency, formatDateTime, formatNumber } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

const CONTROL = 'focus-ring w-full rounded-lg border border-themed bg-transparent px-3 py-2.5 text-sm text-body';

@Component({
  selector: 'app-distribution-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    PageHeaderComponent,
    IconComponent,
    ModalComponent,
    RssPreviewComponent,
    SponsorRowComponent,
    FeedStatePillComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *transloco="let t">
      <app-page-header
        [title]="t('distribution.title')"
        [subtitle]="t('distribution.subtitle')"
        [hasAction]="false"
      />

      <!-- ---- Feed ---- -->
      <div class="surface-card rounded-2xl border p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/15"
          >
            <app-icon name="rss" [size]="22" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-heading">{{ t('distribution.feedTitle') }}</p>
            <p class="mt-0.5 truncate font-mono text-xs text-muted">{{ show.feedUrl }}</p>
            <p class="mt-1 text-xs text-muted">{{ t('distribution.feedHint') }}</p>
          </div>
          <button
            type="button"
            (click)="copyUrl()"
            class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <app-icon name="copy" [size]="15" />
            {{ t('distribution.copyUrl') }}
          </button>
        </div>
      </div>

      <!-- ---- Prévia do XML ---- -->
      <div class="mt-6">
        <app-rss-preview [episodes]="podcast.episodes()" [limit]="3" />
      </div>

      <!-- ---- Plataformas ---- -->
      <div class="mt-6 surface-card rounded-2xl border p-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-base font-semibold text-heading">{{ t('distribution.platforms') }}</h2>
          <p class="text-xs text-muted">{{ t('distribution.platformsHint') }}</p>
        </div>

        <div class="mt-4 grid gap-3 lg:grid-cols-2">
          @for (d of podcast.distributions(); track d.platform) {
            <div class="flex flex-col gap-3 rounded-xl border border-themed p-4 sm:flex-row sm:items-center">
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-body dark:bg-gray-800"
              >
                <app-icon [name]="platformIcon(d.platform)" [size]="20" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-semibold text-heading">{{ d.platform }}</p>
                  <app-feed-state-pill [state]="d.state" />
                </div>
                <p class="mt-1 text-xs text-muted">
                  {{ t('distribution.followers') }}: {{ num(d.followers) }} ·
                  {{ t('distribution.lastSync') }}: {{ dateTime(d.lastSyncAt) }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  (click)="resync()"
                  [title]="t('distribution.resync')"
                  class="flex h-9 w-9 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-brand-600"
                >
                  <app-icon name="refresh-cw" [size]="15" />
                </button>
                <a
                  [href]="d.url"
                  target="_blank"
                  rel="noreferrer noopener"
                  [title]="t('distribution.open')"
                  class="flex h-9 w-9 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-brand-600"
                >
                  <app-icon name="external-link" [size]="15" />
                </a>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ---- Patrocinadores ---- -->
      <div class="mt-6 surface-card rounded-2xl border p-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-heading">{{ t('distribution.sponsors') }}</h2>
            <p class="mt-1 text-xs text-muted">{{ t('distribution.sponsorsHint') }}</p>
          </div>
          <p class="text-sm font-semibold text-success-600">
            {{ t('sponsors.totalRevenue') }}: {{ currency(revenue()) }}
          </p>
        </div>

        <div class="mt-4 space-y-3">
          @for (sponsor of podcast.sponsors(); track sponsor.id) {
            <app-sponsor-row [sponsor]="sponsor" [editable]="true" (edit)="editing.set($event)" />
          }
        </div>
      </div>

      <!-- ---- Editar patrocinador ---- -->
      <app-modal
        [open]="editing() !== null"
        (closed)="editing.set(null)"
        size="lg"
        [title]="t('sponsors.editTitle')"
        [subtitle]="editing()?.name"
        [hasFooter]="true"
      >
        @if (editing(); as sponsor) {
          <div class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-heading" for="sp-name">
                  {{ t('sponsors.name') }}
                </label>
                <input
                  id="sp-name"
                  [ngModel]="sponsor.name"
                  (ngModelChange)="patchSponsor(sponsor, { name: $event })"
                  [class]="control"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-heading" for="sp-slot">
                  {{ t('sponsors.slot') }}
                </label>
                <select
                  id="sp-slot"
                  [ngModel]="sponsor.slot"
                  (ngModelChange)="patchSponsor(sponsor, { slot: $any($event) })"
                  [class]="control"
                >
                  @for (s of slots; track s) {
                    <option [value]="s">{{ t('adSlots.' + s) }}</option>
                  }
                </select>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-heading" for="sp-cpm">
                {{ t('sponsors.cpmField') }}
              </label>
              <input
                id="sp-cpm"
                type="number"
                [min]="0"
                [ngModel]="sponsor.cpm"
                (ngModelChange)="patchSponsor(sponsor, { cpm: +$event })"
                [class]="control"
              />
            </div>

            <div>
              <p class="mb-2 text-sm font-medium text-heading">{{ t('sponsors.episodes') }}</p>
              <div class="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-themed p-2">
                @for (episode of published(); track episode.id) {
                  <label
                    class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      [ngModel]="sponsor.episodeIds.includes(episode.id)"
                      (ngModelChange)="toggleEpisode(sponsor, episode.id)"
                      class="h-4 w-4 shrink-0 rounded border-themed accent-brand-500"
                    />
                    <span class="min-w-0 truncate text-body">{{ episode.number }}. {{ episode.title }}</span>
                  </label>
                }
              </div>
            </div>
          </div>
        }

        <ng-container modalFooter>
          <button
            type="button"
            (click)="editing.set(null)"
            class="rounded-lg border border-themed px-4 py-2 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            (click)="saveSponsor()"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {{ t('common.save') }}
          </button>
        </ng-container>
      </app-modal>
    </div>
  `,
})
export class DistributionPageComponent {
  podcast = inject(PodcastService);
  private ui = inject(UiService);
  private transloco = inject(TranslocoService);
  private lang = activeLang();

  protected readonly show = SHOW;
  protected readonly control = CONTROL;
  protected readonly slots: AdSlot[] = ['pre-roll', 'mid-roll', 'pos-roll'];
  protected readonly editing = signal<Sponsor | null>(null);

  protected readonly published = computed(() => publishedEpisodes(this.podcast.episodes()));
  protected readonly revenue = computed(() => totalSponsorRevenue(this.podcast.sponsors()));

  constructor() {
    usePageTitle('distribution.title');
  }

  protected platformIcon(p: PlatformName) {
    return PLATFORM_ICON[p];
  }
  protected num(v: number) {
    return formatNumber(v, this.lang());
  }
  protected currency(v: number) {
    return formatCurrency(v, this.lang());
  }
  protected dateTime(iso: string) {
    return formatDateTime(iso, this.lang());
  }

  protected async copyUrl() {
    try {
      await navigator.clipboard.writeText(SHOW.feedUrl);
      this.ui.notifySuccess(this.transloco.translate('distribution.copied'));
    } catch {
      this.ui.notifyError(this.transloco.translate('distribution.copyFailed'));
    }
  }

  protected resync() {
    this.ui.notifySuccess(this.transloco.translate('distribution.resynced'));
  }

  protected patchSponsor(sponsor: Sponsor, patch: Partial<Sponsor>) {
    this.podcast.updateSponsor(sponsor.id, patch);
    this.editing.set({ ...sponsor, ...patch });
  }

  protected toggleEpisode(sponsor: Sponsor, episodeId: number) {
    this.podcast.toggleSponsorEpisode(sponsor.id, episodeId);
    const next = this.podcast.sponsors().find((s) => s.id === sponsor.id);
    if (next) this.editing.set({ ...next });
  }

  protected saveSponsor() {
    this.ui.notifySuccess(this.transloco.translate('sponsors.saved'));
    this.editing.set(null);
  }
}
