import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { downloadsByPlatform } from '@app/core/data/query';
import type { PlatformName, PlatformStat } from '@app/core/data/types';
import { formatNumber, formatPercent } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

export const PLATFORM_ICON: Record<PlatformName, string> = {
  Spotify: 'spotify',
  Apple: 'apple',
  Google: 'globe',
  YouTube: 'youtube',
  Site: 'rss',
};

const PLATFORM_COLOR: Record<PlatformName, string> = {
  Spotify: 'bg-success-500',
  Apple: 'bg-gray-500',
  Google: 'bg-blue-light-500',
  YouTube: 'bg-error-500',
  Site: 'bg-brand-500',
};

/** Downloads por plataforma como barras horizontais. */
@Component({
  selector: 'app-platform-bars',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex flex-col gap-4">
      @for (row of rows(); track row.platform) {
        <li>
          <div class="flex items-center justify-between gap-3 text-sm">
            <span class="inline-flex min-w-0 items-center gap-2 text-body">
              <app-icon [name]="icon(row.platform)" [size]="16" class="text-muted" />
              <span class="truncate font-medium">{{ row.platform }}</span>
            </span>
            <span class="shrink-0 text-xs text-muted">
              {{ num(row.downloads) }} · {{ pct(row.share) }}
            </span>
          </div>
          <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div [class]="'h-full rounded-full ' + color(row.platform)" [style.width.%]="(row.downloads / max()) * 100"></div>
          </div>
        </li>
      }
    </ul>
  `,
})
export class PlatformBarsComponent {
  @Input({ required: true }) set stats(v: PlatformStat[]) {
    this._stats.set(v);
  }
  private _stats = signal<PlatformStat[]>([]);
  private lang = activeLang();

  protected readonly rows = computed(() => downloadsByPlatform(this._stats()));
  protected readonly max = computed(() => Math.max(1, ...this.rows().map((r) => r.downloads)));

  protected icon(p: PlatformName) {
    return PLATFORM_ICON[p];
  }
  protected color(p: PlatformName) {
    return PLATFORM_COLOR[p];
  }
  protected num(v: number) {
    return formatNumber(v, this.lang());
  }
  protected pct(v: number) {
    return formatPercent(v, this.lang());
  }
}
