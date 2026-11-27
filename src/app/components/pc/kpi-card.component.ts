import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from '@app/components/ui/icon-base.component';

type Accent = 'brand' | 'success' | 'warning' | 'error' | 'info';

const BG_MAP: Record<Accent, string> = {
  brand: 'bg-brand-50 dark:bg-brand-500/15',
  success: 'bg-success-50 dark:bg-success-500/15',
  warning: 'bg-warning-50 dark:bg-warning-500/15',
  error: 'bg-error-50 dark:bg-error-500/15',
  info: 'bg-blue-light-50 dark:bg-blue-light-500/15',
};

const COLOR_MAP: Record<Accent, string> = {
  brand: 'text-brand-500',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-500',
  info: 'text-blue-light-500',
};

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="surface-card rounded-2xl border border-themed p-5 shadow-theme-sm md:p-6">
      <div class="flex items-start justify-between gap-3">
        <div [class]="'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ' + bg()">
          <app-icon [name]="icon" [size]="22" [class]="color()" />
        </div>
        @if (trend) {
          <span
            [class]="
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ' +
              (trend === 'up'
                ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500')
            "
          >
            <app-icon [name]="trend === 'up' ? 'arrow-up' : 'arrow-down'" [size]="12" [strokeWidth]="2.5" />
            {{ trendValue }}
          </span>
        }
      </div>
      <div class="mt-5 min-w-0">
        <span class="text-sm text-muted">{{ title }}</span>
        <h4 class="mt-2 text-title-sm font-bold break-words text-heading">{{ value }}</h4>
        @if (hint) {
          <p class="mt-1 text-xs text-muted">{{ hint }}</p>
        }
      </div>
    </div>
  `,
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() icon = '';
  @Input() accent: Accent = 'brand';
  @Input() hint?: string;
  @Input() trend?: 'up' | 'down';
  @Input() trendValue?: string;

  protected bg() {
    return BG_MAP[this.accent];
  }
  protected color() {
    return COLOR_MAP[this.accent];
  }
}
