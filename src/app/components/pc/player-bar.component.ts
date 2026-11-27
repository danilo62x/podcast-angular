import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  computed,
  effect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { pcImage } from '@app/core/data/mock';
import { chapterAt, episodeById } from '@app/core/data/query';
import { PlayerService } from '@app/core/services/player.service';
import { PodcastService } from '@app/core/services/podcast.service';
import { formatClock } from '@app/lib/format';
import { WaveformComponent } from './waveform.component';

/**
 * Barra fixa no rodapé do site público. Não existe arquivo de áudio: a posição
 * avança por um `setInterval` de 1s enquanto tocando, multiplicado pela
 * velocidade escolhida. O intervalo roda fora da zona do Angular (só entra nela
 * quando a posição muda de verdade) e é limpo ao pausar e ao destruir.
 */
@Component({
  selector: 'app-player-bar',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslocoModule, IconComponent, WaveformComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (episode(); as ep) {
      <div class="surface-header fixed inset-x-0 bottom-0 z-50 border-t shadow-theme-lg" *transloco="let t">
        <!-- Progresso fino — é o que aparece no celular no lugar da onda. -->
        <div class="h-[3px] w-full bg-gray-200 sm:hidden dark:bg-gray-800">
          <div class="h-full bg-brand-500" [style.width.%]="progress()"></div>
        </div>

        <div class="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-6 lg:px-8">
          <a [routerLink]="['/episodio', ep.slug]" class="flex min-w-0 items-center gap-3">
            <img [src]="cover(ep.coverSeed)" alt="" class="h-11 w-11 shrink-0 rounded-lg object-cover" />
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold text-heading">{{ ep.title }}</span>
              <span class="block truncate text-xs text-muted">
                {{ chapter()?.title ?? t('player.noChapter') }}
              </span>
            </span>
          </a>

          <div class="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              (click)="player.skip(-15)"
              [attr.aria-label]="t('player.back15')"
              [title]="t('player.back15')"
              class="hidden h-10 w-10 items-center justify-center rounded-full border border-themed text-body transition hover:bg-gray-50 sm:flex dark:hover:bg-gray-800"
            >
              <app-icon name="skip-back" [size]="18" />
            </button>
            <button
              type="button"
              (click)="player.toggle()"
              [attr.aria-label]="player.playing() ? t('player.pause') : t('player.play')"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600"
            >
              <app-icon [name]="player.playing() ? 'pause' : 'play'" [size]="20" />
            </button>
            <button
              type="button"
              (click)="player.skip(15)"
              [attr.aria-label]="t('player.forward15')"
              [title]="t('player.forward15')"
              class="hidden h-10 w-10 items-center justify-center rounded-full border border-themed text-body transition hover:bg-gray-50 sm:flex dark:hover:bg-gray-800"
            >
              <app-icon name="skip-forward" [size]="18" />
            </button>
          </div>

          <div class="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
            <span class="shrink-0 font-mono text-xs text-muted tabular-nums">
              {{ clock(player.positionSec()) }}
            </span>
            <app-waveform
              [seed]="ep.slug"
              [durationSec]="ep.durationSec"
              [positionSec]="player.positionSec()"
              [bars]="72"
              [height]="28"
              [seekable]="true"
              (seek)="player.seek($event)"
              extraClass="min-w-0 flex-1"
            />
            <span class="shrink-0 font-mono text-xs text-muted tabular-nums">
              {{ clock(ep.durationSec) }}
            </span>
          </div>

          <div class="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              (click)="player.cycleSpeed()"
              [title]="t('player.speed')"
              [attr.aria-label]="t('player.speed')"
              class="flex h-9 min-w-11 items-center justify-center gap-1 rounded-lg border border-themed px-2 text-xs font-semibold text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <app-icon name="gauge" [size]="14" />
              {{ player.speed() }}x
            </button>

            <div class="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                (click)="player.toggleMute()"
                [attr.aria-label]="t('player.volume')"
                class="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:text-heading"
              >
                <app-icon
                  [name]="player.muted() || player.volume() === 0 ? 'volume-x' : 'volume'"
                  [size]="18"
                />
              </button>
              <input
                type="range"
                [min]="0"
                [max]="100"
                [ngModel]="volumePercent()"
                (ngModelChange)="player.setVolume(+$event / 100)"
                [attr.aria-label]="t('player.volume')"
                class="h-1 w-20 cursor-pointer"
              />
            </div>

            <button
              type="button"
              (click)="player.close()"
              [attr.aria-label]="t('player.close')"
              [title]="t('player.close')"
              class="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:text-heading"
            >
              <app-icon name="x" [size]="18" />
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PlayerBarComponent implements OnDestroy {
  protected player = inject(PlayerService);
  private podcast = inject(PodcastService);
  private zone = inject(NgZone);
  private timer?: ReturnType<typeof setInterval>;

  protected readonly episode = computed(() => {
    const id = this.player.episodeId();
    return id === null ? undefined : episodeById(this.podcast.episodes(), id);
  });

  protected readonly chapter = computed(() => {
    const ep = this.episode();
    return ep ? chapterAt(ep.chapters, this.player.positionSec()) : undefined;
  });

  protected readonly progress = computed(() => {
    const ep = this.episode();
    return ep && ep.durationSec ? (this.player.positionSec() / ep.durationSec) * 100 : 0;
  });

  protected readonly volumePercent = computed(() =>
    Math.round((this.player.muted() ? 0 : this.player.volume()) * 100)
  );

  protected clock = formatClock;
  protected cover(seed: string) {
    return pcImage(seed, 96, 96);
  }

  constructor() {
    // O temporizador é o "áudio" do template: liga ao tocar, desliga ao pausar.
    effect(() => {
      const shouldRun = this.player.playing() && !!this.episode();
      this.stopTimer();
      if (!shouldRun) return;
      this.zone.runOutsideAngular(() => {
        this.timer = setInterval(() => {
          // `tick()` devolve false quando nada mudou — aí nem entramos na zona,
          // e a detecção de mudança não roda à toa uma vez por segundo.
          if (this.player.tick()) this.zone.run(() => undefined);
        }, 1000);
      });
    });
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}
