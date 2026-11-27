import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { biggestRetentionDrop } from '@app/core/data/query';
import { formatClock, formatPercent } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

const W = 100;
const H = 40;

/**
 * Curva de retenção dentro do episódio como gráfico de área, com o ponto de
 * maior queda anotado — é ali que as pessoas param de ouvir.
 */
@Component({
  selector: 'app-retention-chart',
  standalone: true,
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (!geometry()) {
        <p class="py-10 text-center text-sm text-muted">{{ t('audience.noRetention') }}</p>
      } @else {
        <div>
          <div class="relative w-full" [style.height.px]="height">
            <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" class="h-full w-full">
              <defs>
                <linearGradient id="pc-retention" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#465fff" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="#465fff" stop-opacity="0.02" />
                </linearGradient>
              </defs>
              @for (g of guides; track g) {
                <line
                  x1="0"
                  [attr.x2]="W"
                  [attr.y1]="H - g * H"
                  [attr.y2]="H - g * H"
                  stroke="currentColor"
                  stroke-width="0.2"
                  class="text-gray-300 dark:text-gray-700"
                  stroke-dasharray="1 1"
                />
              }
              <polygon [attr.points]="geometry()!.area" fill="url(#pc-retention)" />
              <polyline
                [attr.points]="geometry()!.line"
                fill="none"
                stroke="#465fff"
                stroke-width="0.7"
                vector-effect="non-scaling-stroke"
                stroke-linejoin="round"
              />
              @if (dropPoint()) {
                <line
                  [attr.x1]="dropPoint()!.x"
                  [attr.x2]="dropPoint()!.x"
                  y1="0"
                  [attr.y2]="H"
                  stroke="#f04438"
                  stroke-width="0.4"
                  stroke-dasharray="1.5 1.5"
                  vector-effect="non-scaling-stroke"
                />
                <circle [attr.cx]="dropPoint()!.x" [attr.cy]="dropPoint()!.y" r="0.9" fill="#f04438" />
              }
            </svg>

            @if (dropPoint() && drop()) {
              <div
                class="pointer-events-none absolute top-2"
                [style.left.%]="dropPoint()!.x"
                [style.transform]="labelOnLeft() ? 'translateX(calc(-100% - 6px))' : 'translateX(6px)'"
              >
                <span
                  class="inline-block max-w-[11rem] rounded-lg bg-error-50 px-2.5 py-1.5 text-[11px] leading-tight font-medium text-error-600 shadow-theme-xs dark:bg-error-500/20 dark:text-error-400"
                >
                  {{
                    t('audience.dropAt', {
                      time: clock(drop()!.atSec),
                      delta: pct(drop()!.delta)
                    })
                  }}
                </span>
              </div>
            }
          </div>

          <div class="mt-2 flex items-center justify-between text-xs text-muted">
            <span>{{ clock(0) }}</span>
            <span>{{ clock(round(durationSec / 2)) }}</span>
            <span>{{ clock(durationSec) }}</span>
          </div>
        </div>
      }
    </ng-container>
  `,
})
export class RetentionChartComponent {
  /** 20 pontos, 0..1, decrescentes. */
  @Input({ required: true }) set retention(v: number[]) {
    this._retention.set(v);
  }
  @Input({ required: true }) set durationSec(v: number) {
    this._duration.set(v);
  }
  get durationSec() {
    return this._duration();
  }
  @Input() height = 200;

  private _retention = signal<number[]>([]);
  private _duration = signal(0);
  private lang = activeLang();

  protected readonly W = W;
  protected readonly H = H;
  protected readonly guides = [0.25, 0.5, 0.75];
  protected round = Math.round;
  protected clock = formatClock;
  protected pct = (v: number) => formatPercent(v, this.lang());

  protected readonly geometry = computed(() => {
    const retention = this._retention();
    if (retention.length < 2) return null;
    const step = W / (retention.length - 1);
    const points = retention.map((v, i) => ({ x: i * step, y: H - v * H }));
    const line = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const area = `0,${H} ${line} ${W},${H}`;
    return { points, line, area };
  });

  protected readonly drop = computed(() => biggestRetentionDrop(this._retention(), this._duration()));

  protected readonly dropPoint = computed(() => {
    const g = this.geometry();
    const d = this.drop();
    return g && d ? g.points[d.index] : null;
  });

  protected readonly labelOnLeft = computed(() => {
    const p = this.dropPoint();
    return p ? p.x > W * 0.6 : false;
  });
}
