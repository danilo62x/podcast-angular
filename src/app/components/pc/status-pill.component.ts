import {
  ChangeDetectionStrategy,
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { BadgeComponent } from '@app/components/ui/badge.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { countdownTo } from '@app/core/data/query';
import type { AdSlot, EpisodeStatus, FeedState } from '@app/core/data/types';

type Color = 'brand' | 'success' | 'warning' | 'error' | 'gray';

const STATUS_COLOR: Record<EpisodeStatus, Color> = {
  rascunho: 'gray',
  agendado: 'warning',
  publicado: 'success',
};

@Component({
  selector: 'app-episode-status-pill',
  standalone: true,
  imports: [TranslocoModule, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-badge [color]="color()" [dot]="true">{{ 'episodeStatuses.' + status | transloco }}</app-badge>`,
})
export class EpisodeStatusPillComponent {
  @Input({ required: true }) status!: EpisodeStatus;
  color() {
    return STATUS_COLOR[this.status];
  }
}

const SLOT_COLOR: Record<AdSlot, Color> = {
  'pre-roll': 'brand',
  'mid-roll': 'warning',
  'pos-roll': 'gray',
};

@Component({
  selector: 'app-ad-slot-pill',
  standalone: true,
  imports: [TranslocoModule, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-badge [color]="color()">{{ 'adSlots.' + slot | transloco }}</app-badge>`,
})
export class AdSlotPillComponent {
  @Input({ required: true }) slot!: AdSlot;
  color() {
    return SLOT_COLOR[this.slot];
  }
}

const FEED_COLOR: Record<FeedState, Color> = {
  ativo: 'success',
  pendente: 'warning',
  erro: 'error',
};

@Component({
  selector: 'app-feed-state-pill',
  standalone: true,
  imports: [TranslocoModule, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-badge [color]="color()" [dot]="true">{{ 'feedStates.' + state | transloco }}</app-badge>`,
})
export class FeedStatePillComponent {
  @Input({ required: true }) state!: FeedState;
  color() {
    return FEED_COLOR[this.state];
  }
}

@Component({
  selector: 'app-explicit-pill',
  standalone: true,
  imports: [TranslocoModule, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-badge color="error" icon="alert-triangle">{{ 'episode.explicit' | transloco }}</app-badge>`,
})
export class ExplicitPillComponent {}

/**
 * Contagem regressiva derivada de `scheduledAt` — atualiza a cada minuto e
 * limpa o temporizador ao destruir.
 */
@Component({
  selector: 'app-countdown-badge',
  standalone: true,
  imports: [TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-500"
      *transloco="let t"
    >
      <app-icon name="calendar-clock" [size]="13" />
      {{ label(t) }}
    </span>
  `,
})
export class CountdownBadgeComponent implements OnInit, OnDestroy {
  @Input({ required: true }) scheduledAt!: string;

  private zone = inject(NgZone);
  private timer?: ReturnType<typeof setInterval>;
  protected now = signal(new Date());

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => this.zone.run(() => this.now.set(new Date())), 60000);
    });
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  protected label(t: (key: string, params?: Record<string, unknown>) => string) {
    const c = countdownTo(this.scheduledAt, this.now());
    if (c.total <= 0) return t('episode.countdownNow');
    if (c.days > 0) return t('episode.countdownDays', { days: c.days, hours: c.hours });
    return t('episode.countdownHours', { hours: c.hours, minutes: c.minutes });
  }
}
