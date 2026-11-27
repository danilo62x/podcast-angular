import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { PlayerService } from '@app/core/services/player.service';
import type { Episode } from '@app/core/data/types';

const DIM: Record<string, string> = { sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-14 w-14' };
const ICON: Record<string, number> = { sm: 16, md: 20, lg: 24 };

/** Botão que carrega o episódio na barra global e alterna tocar/pausar. */
@Component({
  selector: 'app-play-button',
  standalone: true,
  imports: [TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (withLabel) {
        <button
          type="button"
          (click)="handleClick()"
          [class]="'inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-medium transition ' + base()"
        >
          <app-icon [name]="isPlaying() ? 'pause' : 'play'" [size]="18" />
          {{ isPlaying() ? t('player.pause') : t('player.listen') }}
        </button>
      } @else {
        <button
          type="button"
          (click)="handleClick()"
          [attr.aria-label]="isPlaying() ? t('player.pause') : t('player.listen')"
          [title]="isPlaying() ? t('player.pause') : t('player.listen')"
          [class]="
            'inline-flex shrink-0 items-center justify-center rounded-full transition ' + dim() + ' ' + base()
          "
        >
          <app-icon [name]="isPlaying() ? 'pause' : 'play'" [size]="iconSize()" />
        </button>
      }
    </ng-container>
  `,
})
export class PlayButtonComponent {
  @Input({ required: true }) episode!: Episode;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'solid' | 'ghost' = 'solid';
  /** Mostra o rótulo "Ouvir" ao lado do ícone. */
  @Input() withLabel = false;

  private player = inject(PlayerService);

  readonly isPlaying = computed(
    () => this.player.episodeId() === this.episode.id && this.player.playing()
  );

  protected dim() {
    return DIM[this.size];
  }
  protected iconSize() {
    return ICON[this.size];
  }
  protected base() {
    return this.variant === 'solid'
      ? 'bg-brand-500 text-white hover:bg-brand-600'
      : 'border border-themed text-body hover:bg-gray-50 dark:hover:bg-gray-800';
  }

  protected handleClick() {
    if (this.player.episodeId() === this.episode.id) this.player.toggle();
    else this.player.load(this.episode.id, this.episode.durationSec, true);
  }
}
