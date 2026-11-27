import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { downloadsByCountry } from '@app/core/data/query';
import type { CountryStat } from '@app/core/data/types';
import { formatNumber, formatPercent } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

/** Downloads por país, com a barra proporcional atrás do nome. */
@Component({
  selector: 'app-country-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex flex-col gap-1">
      @for (row of rows(); track row.country) {
        <li class="relative overflow-hidden rounded-lg">
          <span
            aria-hidden="true"
            class="absolute inset-y-0 left-0 bg-brand-50 dark:bg-brand-500/10"
            [style.width.%]="(row.downloads / max()) * 100"
          ></span>
          <div class="relative flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span class="min-w-0 truncate font-medium text-body">{{ row.country }}</span>
            <span class="shrink-0 text-xs text-muted tabular-nums">
              {{ num(row.downloads) }} · {{ pct(row.share) }}
            </span>
          </div>
        </li>
      }
    </ul>
  `,
})
export class CountryListComponent {
  @Input({ required: true }) set stats(v: CountryStat[]) {
    this._stats.set(v);
  }
  @Input() set limit(v: number | undefined) {
    this._limit.set(v);
  }

  private _stats = signal<CountryStat[]>([]);
  private _limit = signal<number | undefined>(undefined);
  private lang = activeLang();

  protected readonly rows = computed(() =>
    downloadsByCountry(this._stats()).slice(0, this._limit() ?? this._stats().length)
  );
  protected readonly max = computed(() => Math.max(1, ...this.rows().map((r) => r.downloads)));

  protected num(v: number) {
    return formatNumber(v, this.lang());
  }
  protected pct(v: number) {
    return formatPercent(v, this.lang());
  }
}
