import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { pcImage } from '@app/core/data/mock';
import { sponsorRevenue } from '@app/core/data/query';
import type { Sponsor } from '@app/core/data/types';
import { formatCompact, formatCurrency, formatNumber } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';
import { AdSlotPillComponent } from './status-pill.component';

/** Linha de patrocinador com o espaço do anúncio e o faturamento estimado. */
@Component({
  selector: 'app-sponsor-row',
  standalone: true,
  imports: [TranslocoModule, IconComponent, AdSlotPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="surface-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center" *transloco="let t">
      <img [src]="logo()" alt="" class="h-12 w-12 shrink-0 rounded-lg object-cover" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="truncate text-sm font-semibold text-heading">{{ sponsor.name }}</p>
          <app-ad-slot-pill [slot]="sponsor.slot" />
        </div>
        <p class="mt-1 text-xs text-muted">
          {{ t('sponsors.inEpisodes', { count: sponsor.episodeIds.length }) }}
        </p>
      </div>

      <dl class="grid grid-cols-3 gap-4 text-right sm:w-72">
        <div class="min-w-0">
          <dt class="truncate text-[11px] text-muted">{{ t('sponsors.impressions') }}</dt>
          <dd class="text-sm font-semibold text-heading">{{ compact(sponsor.impressions) }}</dd>
        </div>
        <div class="min-w-0">
          <dt class="truncate text-[11px] text-muted">{{ t('sponsors.cpm') }}</dt>
          <dd class="text-sm font-semibold text-heading">{{ num(sponsor.cpm) }}</dd>
        </div>
        <div class="min-w-0">
          <dt class="truncate text-[11px] text-muted">{{ t('sponsors.revenue') }}</dt>
          <dd class="text-sm font-semibold text-success-600">{{ revenue() }}</dd>
        </div>
      </dl>

      @if (editable) {
        <button
          type="button"
          (click)="edit.emit(sponsor)"
          class="focus-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <app-icon name="edit" [size]="14" />
          {{ t('common.edit') }}
        </button>
      }
    </div>
  `,
})
export class SponsorRowComponent {
  @Input({ required: true }) sponsor!: Sponsor;
  @Input() editable = false;
  @Output() edit = new EventEmitter<Sponsor>();

  private lang = activeLang();

  protected logo() {
    return pcImage(this.sponsor.logoSeed, 120, 120);
  }
  protected compact(v: number) {
    return formatCompact(v, this.lang());
  }
  protected num(v: number) {
    return formatNumber(v, this.lang());
  }
  protected revenue() {
    return formatCurrency(sponsorRevenue(this.sponsor), this.lang());
  }
}
